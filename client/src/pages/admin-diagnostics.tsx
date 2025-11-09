import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Send, RefreshCw } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminDiagnosticsPage() {
  const { toast } = useToast();
  const [testPhone, setTestPhone] = useState("+85265727136");
  const [testMessage, setTestMessage] = useState("PetSOS WhatsApp Test");

  // Test WhatsApp connection
  const testWhatsAppMutation = useMutation({
    mutationFn: (data: { phoneNumber: string; message: string }) =>
      apiRequest("POST", "/api/admin/test-whatsapp", data),
    onSuccess: (data: any) => {
      if (data.success) {
        toast({
          title: "Test Successful",
          description: "WhatsApp message sent successfully!",
        });
        // Refresh failed messages list
        queryClient.invalidateQueries({ queryKey: ["/api/admin/failed-messages"] });
      }
    },
    onError: (error: any) => {
      console.error("WhatsApp test error:", error);
      toast({
        title: "Test Failed",
        description: error.message || "Failed to send test message",
        variant: "destructive",
      });
    },
  });

  // Get failed messages
  const {
    data: failedMessages,
    isLoading: loadingFailed,
    refetch: refetchFailed,
  } = useQuery({
    queryKey: ["/api/admin/failed-messages"],
  });

  const handleTest = () => {
    testWhatsAppMutation.mutate({
      phoneNumber: testPhone,
      message: testMessage,
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">WhatsApp Diagnostics</h1>
        <p className="text-muted-foreground">
          Test your WhatsApp Business API connection and view message failures
        </p>
      </div>

      {/* Test WhatsApp Connection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test WhatsApp Connection</CardTitle>
          <CardDescription>
            Send a test message to verify your WhatsApp credentials are working
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+85265727136"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                data-testid="input-test-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Test Message</Label>
              <Input
                id="message"
                placeholder="Test message"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                data-testid="input-test-message"
              />
            </div>
          </div>

          <Button
            onClick={handleTest}
            disabled={testWhatsAppMutation.isPending}
            className="w-full sm:w-auto"
            data-testid="button-test-whatsapp"
          >
            {testWhatsAppMutation.isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Test Message
              </>
            )}
          </Button>

          {/* Test Results */}
          {testWhatsAppMutation.data && (
            <Alert
              className={
                (testWhatsAppMutation.data as any).success
                  ? "border-green-500 bg-green-50 dark:bg-green-950"
                  : "border-red-500 bg-red-50 dark:bg-red-950"
              }
              data-testid="alert-test-result"
            >
              {(testWhatsAppMutation.data as any).success ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                <div className="font-semibold mb-2">
                  {(testWhatsAppMutation.data as any).success
                    ? "✅ Success!"
                    : "❌ Failed"}
                </div>
                {(testWhatsAppMutation.data as any).success ? (
                  <div className="space-y-1 text-sm">
                    <p>{(testWhatsAppMutation.data as any).message}</p>
                    {(testWhatsAppMutation.data as any).debugInfo?.messageId && (
                      <p className="font-mono text-xs">
                        Message ID:{" "}
                        {(testWhatsAppMutation.data as any).debugInfo.messageId}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">
                      {(testWhatsAppMutation.data as any).error}
                    </p>
                    {(testWhatsAppMutation.data as any).statusCode && (
                      <p>
                        Status Code:{" "}
                        {(testWhatsAppMutation.data as any).statusCode}
                      </p>
                    )}
                    {(testWhatsAppMutation.data as any).details && (
                      <div className="mt-2">
                        <p className="font-semibold">Details:</p>
                        <pre className="mt-1 p-2 bg-white dark:bg-gray-900 rounded text-xs overflow-x-auto">
                          {JSON.stringify(
                            (testWhatsAppMutation.data as any).details,
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {testWhatsAppMutation.error && (
            <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <p className="font-semibold">Request Error</p>
                <p className="text-sm">
                  {(testWhatsAppMutation.error as any).message ||
                    "Failed to connect to server"}
                </p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Failed Messages */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Failed Messages</CardTitle>
            <CardDescription>
              Messages that failed to send via WhatsApp API
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchFailed()}
            disabled={loadingFailed}
            data-testid="button-refresh-failed"
          >
            <RefreshCw
              className={`h-4 w-4 ${loadingFailed ? "animate-spin" : ""}`}
            />
          </Button>
        </CardHeader>
        <CardContent>
          {loadingFailed ? (
            <p className="text-muted-foreground text-center py-8">
              Loading...
            </p>
          ) : failedMessages && (failedMessages as any).total > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="destructive" data-testid="badge-failed-count">
                  {(failedMessages as any).total} Failed
                </Badge>
              </div>
              <div className="space-y-3">
                {(failedMessages as any).messages.map((msg: any, idx: number) => (
                  <div
                    key={msg.id}
                    className="border rounded-lg p-4 space-y-2"
                    data-testid={`failed-message-${idx}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-semibold">To: {msg.recipient}</p>
                        <p className="text-sm text-muted-foreground">
                          Type: {msg.messageType}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {msg.retryCount}/3 retries
                      </Badge>
                    </div>
                    {msg.error && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Error: {msg.error}
                      </p>
                    )}
                    {msg.failedAt && (
                      <p className="text-xs text-muted-foreground">
                        Failed at: {new Date(msg.failedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No failed messages found
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
