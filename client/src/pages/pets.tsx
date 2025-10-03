import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { PawPrint, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import type { Pet } from "@shared/schema";

const petSchema = z.object({
  name: z.string().min(1, "Pet name is required"),
  species: z.string().min(1, "Species is required"),
  breed: z.string().optional(),
  age: z.coerce.number().positive().optional(),
  weight: z.coerce.number().positive().optional(),
  medicalNotes: z.string().optional(),
});

type PetFormData = z.infer<typeof petSchema>;

export default function PetsPage() {
  const userId = "temp-user-id";
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [deletingPetId, setDeletingPetId] = useState<string | null>(null);

  const { data: pets = [], isLoading: petsLoading } = useQuery<Pet[]>({
    queryKey: ['/api/users', userId, 'pets'],
  });

  const form = useForm<PetFormData>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      name: "",
      species: "",
      breed: "",
      age: undefined,
      weight: undefined,
      medicalNotes: "",
    },
  });

  const createPetMutation = useMutation({
    mutationFn: async (data: PetFormData) => {
      const response = await apiRequest(
        'POST',
        '/api/pets',
        { ...data, userId }
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'pets'] });
      toast({
        title: "Pet added successfully!",
        description: "Your pet has been added to your profile.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add pet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PetFormData }) => {
      const response = await apiRequest(
        'PATCH',
        `/api/pets/${id}`,
        data
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'pets'] });
      toast({
        title: "Pet updated successfully!",
        description: "Your pet's information has been updated.",
      });
      setIsDialogOpen(false);
      setEditingPet(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update pet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePetMutation = useMutation({
    mutationFn: async (petId: string) => {
      const response = await apiRequest(
        'DELETE',
        `/api/pets/${petId}`,
        {}
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'pets'] });
      toast({
        title: "Pet removed",
        description: "Your pet has been removed from your profile.",
      });
      setDeletingPetId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete pet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PetFormData) => {
    if (editingPet) {
      updatePetMutation.mutate({ id: editingPet.id, data });
    } else {
      createPetMutation.mutate(data);
    }
  };

  const handleEdit = (pet: Pet) => {
    setEditingPet(pet);
    form.reset({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || "",
      age: pet.age ? Number(pet.age) : undefined,
      weight: pet.weight ? Number(pet.weight) : undefined,
      medicalNotes: pet.medicalNotes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (petId: string) => {
    setDeletingPetId(petId);
  };

  const handleAddNew = () => {
    setEditingPet(null);
    form.reset();
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/profile">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Profile
            </Button>
          </Link>
        </div>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PawPrint className="w-6 h-6" />
                My Pets
              </CardTitle>
              <CardDescription>
                Manage your pets for faster emergency requests
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} data-testid="button-add-pet">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Pet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingPet ? "Edit Pet" : "Add New Pet"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Fluffy"
                              data-testid="input-pet-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="species"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Species</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Dog, Cat, etc."
                              data-testid="input-pet-species"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="breed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Breed (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Golden Retriever"
                              data-testid="input-pet-breed"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="age"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                placeholder="3"
                                data-testid="input-pet-age"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weight (kg, Optional)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                step="0.1"
                                placeholder="10.5"
                                data-testid="input-pet-weight"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="medicalNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medical Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Allergies, medications, conditions..."
                              rows={3}
                              data-testid="textarea-pet-medical-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsDialogOpen(false);
                          setEditingPet(null);
                          form.reset();
                        }}
                        data-testid="button-cancel-pet"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createPetMutation.isPending || updatePetMutation.isPending}
                        data-testid="button-save-pet"
                      >
                        {createPetMutation.isPending || updatePetMutation.isPending
                          ? "Saving..."
                          : editingPet
                          ? "Update Pet"
                          : "Add Pet"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {petsLoading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Loading pets...
              </div>
            ) : pets.length === 0 ? (
              <div className="text-center py-12">
                <PawPrint className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No pets added yet
                </p>
                <Button onClick={handleAddNew} data-testid="button-add-first-pet">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Pet
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {pets.map((pet) => (
                  <Card key={pet.id} data-testid={`card-pet-${pet.id}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{pet.name}</span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(pet)}
                            data-testid={`button-edit-pet-${pet.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(pet.id)}
                            data-testid={`button-delete-pet-${pet.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                          </Button>
                        </div>
                      </CardTitle>
                      <CardDescription>
                        {pet.species}
                        {pet.breed && ` • ${pet.breed}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {pet.age && <div>Age: {pet.age} years</div>}
                        {pet.weight && <div>Weight: {pet.weight} kg</div>}
                        {pet.medicalNotes && (
                          <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-yellow-800 dark:text-yellow-200">
                            <strong>Medical:</strong> {pet.medicalNotes}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingPetId} onOpenChange={() => setDeletingPetId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Pet</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this pet from your profile? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletingPetId && deletePetMutation.mutate(deletingPetId)}
                className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                data-testid="button-confirm-delete"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
