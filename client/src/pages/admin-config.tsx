import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit, Trash2 } from "lucide-react";
import type { Country, Region, PetBreed, InsertCountry, InsertRegion, InsertPetBreed } from "@shared/schema";
import { insertCountrySchema, insertRegionSchema, insertPetBreedSchema } from "@shared/schema";
import { z } from "zod";

const countryFormSchema = insertCountrySchema.extend({
  code: z.string().min(1, "Country code is required").max(3),
  nameEn: z.string().min(1, "English name is required"),
  phonePrefix: z.string().min(1, "Phone prefix is required"),
});

const regionFormSchema = insertRegionSchema.extend({
  code: z.string().min(1, "Region code is required"),
  nameEn: z.string().min(1, "English name is required"),
  nameZh: z.string().min(1, "Chinese name is required"),
  countryCode: z.string().min(1, "Country is required"),
});

const breedFormSchema = insertPetBreedSchema.extend({
  species: z.string().min(1, "Species is required"),
  breedEn: z.string().min(1, "Breed name is required"),
});

export default function AdminConfig() {
  const [activeTab, setActiveTab] = useState("countries");

  return (
    <div className="container mx-auto p-6 max-w-7xl" data-testid="page-admin-config">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-red-600" data-testid="text-page-title">Configuration Management</h1>
        <p className="text-muted-foreground mt-2">Manage countries, regions, and pet breeds</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="countries" data-testid="tab-countries">Countries</TabsTrigger>
          <TabsTrigger value="regions" data-testid="tab-regions">Regions</TabsTrigger>
          <TabsTrigger value="breeds" data-testid="tab-breeds">Pet Breeds</TabsTrigger>
        </TabsList>

        <TabsContent value="countries">
          <CountriesTab />
        </TabsContent>

        <TabsContent value="regions">
          <RegionsTab />
        </TabsContent>

        <TabsContent value="breeds">
          <PetBreedsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CountriesTab() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);

  const { data: countries = [], isLoading } = useQuery<Country[]>({
    queryKey: ["/api/countries"],
  });

  const form = useForm<z.infer<typeof countryFormSchema>>({
    resolver: zodResolver(countryFormSchema),
    defaultValues: {
      code: "",
      nameEn: "",
      nameZh: "",
      phonePrefix: "",
      flag: "",
      active: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertCountry) => apiRequest("POST", "/api/countries", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/countries"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Country created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating country",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertCountry> }) =>
      apiRequest("PATCH", `/api/countries/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/countries"] });
      setIsDialogOpen(false);
      setEditingCountry(null);
      form.reset();
      toast({ title: "Country updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating country",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/countries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/countries"] });
      toast({ title: "Country deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting country",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (country?: Country) => {
    if (country) {
      setEditingCountry(country);
      form.reset({
        code: country.code,
        nameEn: country.nameEn,
        nameZh: country.nameZh || "",
        phonePrefix: country.phonePrefix,
        flag: country.flag || "",
        active: country.active,
      });
    } else {
      setEditingCountry(null);
      form.reset({
        code: "",
        nameEn: "",
        nameZh: "",
        phonePrefix: "",
        flag: "",
        active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = (data: z.infer<typeof countryFormSchema>) => {
    // Ensure boolean types are correct
    const payload = {
      ...data,
      active: Boolean(data.active),
    };
    if (editingCountry) {
      updateMutation.mutate({ id: editingCountry.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold" data-testid="text-countries-title">Countries ({countries.length})</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} data-testid="button-add-country">
              <Plus className="mr-2 h-4 w-4" /> Add Country
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCountry ? "Edit Country" : "Add Country"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country Code</FormLabel>
                      <FormControl>
                        <Input placeholder="HK" {...field} data-testid="input-country-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nameEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name (English)</FormLabel>
                      <FormControl>
                        <Input placeholder="Hong Kong" {...field} data-testid="input-country-name-en" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nameZh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name (Chinese)</FormLabel>
                      <FormControl>
                        <Input placeholder="香港" {...field} data-testid="input-country-name-zh" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phonePrefix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Prefix</FormLabel>
                      <FormControl>
                        <Input placeholder="+852" {...field} data-testid="input-country-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="flag"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flag Emoji</FormLabel>
                      <FormControl>
                        <Input placeholder="🇭🇰" {...field} data-testid="input-country-flag" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value === "true")} value={String(field.value)}>
                        <FormControl>
                          <SelectTrigger data-testid="select-country-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit-country">
                  {isPending ? "Saving..." : editingCountry ? "Update" : "Create"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Flag</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Name (EN)</TableHead>
            <TableHead>Name (ZH)</TableHead>
            <TableHead>Phone Prefix</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {countries.map((country) => (
            <TableRow key={country.id} data-testid={`row-country-${country.code}`}>
              <TableCell>{country.flag}</TableCell>
              <TableCell>{country.code}</TableCell>
              <TableCell>{country.nameEn}</TableCell>
              <TableCell>{country.nameZh}</TableCell>
              <TableCell>{country.phonePrefix}</TableCell>
              <TableCell>
                <span className={country.active ? "text-green-600" : "text-gray-400"}>
                  {country.active ? "Active" : "Inactive"}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(country)}
                    data-testid={`button-edit-country-${country.code}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate(country.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-country-${country.code}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RegionsTab() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);

  const { data: regions = [], isLoading: regionsLoading } = useQuery<Region[]>({
    queryKey: ["/api/regions"],
  });

  const { data: countries = [] } = useQuery<Country[]>({
    queryKey: ["/api/countries"],
  });

  const form = useForm<z.infer<typeof regionFormSchema>>({
    resolver: zodResolver(regionFormSchema),
    defaultValues: {
      code: "",
      nameEn: "",
      nameZh: "",
      countryCode: "HK",
      active: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertRegion) => apiRequest("POST", "/api/regions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/regions"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Region created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating region",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertRegion> }) =>
      apiRequest("PATCH", `/api/regions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/regions"] });
      setIsDialogOpen(false);
      setEditingRegion(null);
      form.reset();
      toast({ title: "Region updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating region",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (region?: Region) => {
    // Guard against opening dialog before countries are loaded
    if (!region && countries.length === 0) {
      toast({
        title: "Please wait",
        description: "Loading countries...",
        variant: "destructive",
      });
      return;
    }

    if (region) {
      setEditingRegion(region);
      form.reset({
        code: region.code,
        nameEn: region.nameEn,
        nameZh: region.nameZh,
        countryCode: region.countryCode,
        active: region.active,
      });
    } else {
      setEditingRegion(null);
      form.reset({
        code: "",
        nameEn: "",
        nameZh: "",
        countryCode: countries[0]?.code || "HK",
        active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = (data: z.infer<typeof regionFormSchema>) => {
    // Ensure boolean types are correct
    const payload = {
      ...data,
      active: Boolean(data.active),
    };
    if (editingRegion) {
      updateMutation.mutate({ id: editingRegion.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (regionsLoading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold" data-testid="text-regions-title">Regions ({regions.length})</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} data-testid="button-add-region">
              <Plus className="mr-2 h-4 w-4" /> Add Region
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRegion ? "Edit Region" : "Add Region"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region Code</FormLabel>
                      <FormControl>
                        <Input placeholder="HKI" {...field} data-testid="input-region-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nameEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name (English)</FormLabel>
                      <FormControl>
                        <Input placeholder="Hong Kong Island" {...field} data-testid="input-region-name-en" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nameZh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name (Chinese)</FormLabel>
                      <FormControl>
                        <Input placeholder="香港島" {...field} data-testid="input-region-name-zh" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="countryCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-region-country">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.flag} {country.nameEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value === "true")} value={String(field.value)}>
                        <FormControl>
                          <SelectTrigger data-testid="select-region-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit-region">
                  {isPending ? "Saving..." : editingRegion ? "Update" : "Create"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name (EN)</TableHead>
            <TableHead>Name (ZH)</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {regions.map((region) => {
            const country = countries.find((c) => c.code === region.countryCode);
            return (
              <TableRow key={region.id} data-testid={`row-region-${region.code}`}>
                <TableCell>{region.code}</TableCell>
                <TableCell>{region.nameEn}</TableCell>
                <TableCell>{region.nameZh}</TableCell>
                <TableCell>
                  {country?.flag} {country?.nameEn}
                </TableCell>
                <TableCell>
                  <span className={region.active ? "text-green-600" : "text-gray-400"}>
                    {region.active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(region)}
                    data-testid={`button-edit-region-${region.code}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function PetBreedsTab() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBreed, setEditingBreed] = useState<PetBreed | null>(null);

  const { data: breeds = [], isLoading } = useQuery<PetBreed[]>({
    queryKey: ["/api/pet-breeds"],
  });

  const { data: countries = [] } = useQuery<Country[]>({
    queryKey: ["/api/countries"],
  });

  const form = useForm<z.infer<typeof breedFormSchema>>({
    resolver: zodResolver(breedFormSchema),
    defaultValues: {
      species: "dog",
      breedEn: "",
      breedZh: "",
      countryCode: null,
      isCommon: true,
      active: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertPetBreed) => apiRequest("POST", "/api/pet-breeds", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pet-breeds"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Pet breed created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating breed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertPetBreed> }) =>
      apiRequest("PATCH", `/api/pet-breeds/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pet-breeds"] });
      setIsDialogOpen(false);
      setEditingBreed(null);
      form.reset();
      toast({ title: "Pet breed updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating breed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/pet-breeds/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pet-breeds"] });
      toast({ title: "Pet breed deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting breed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (breed?: PetBreed) => {
    if (breed) {
      setEditingBreed(breed);
      form.reset({
        species: breed.species,
        breedEn: breed.breedEn,
        breedZh: breed.breedZh || "",
        countryCode: breed.countryCode,
        isCommon: breed.isCommon,
        active: breed.active,
      });
    } else {
      setEditingBreed(null);
      form.reset({
        species: "dog",
        breedEn: "",
        breedZh: "",
        countryCode: null,
        isCommon: true,
        active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = (data: z.infer<typeof breedFormSchema>) => {
    // Ensure boolean types are correct and handle nullable countryCode
    const payload = {
      ...data,
      countryCode: data.countryCode || null,
      isCommon: Boolean(data.isCommon),
      active: Boolean(data.active),
    };
    if (editingBreed) {
      updateMutation.mutate({ id: editingBreed.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold" data-testid="text-breeds-title">Pet Breeds ({breeds.length})</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} data-testid="button-add-breed">
              <Plus className="mr-2 h-4 w-4" /> Add Breed
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBreed ? "Edit Pet Breed" : "Add Pet Breed"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="species"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Species</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-breed-species">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="dog">Dog</SelectItem>
                          <SelectItem value="cat">Cat</SelectItem>
                          <SelectItem value="bird">Bird</SelectItem>
                          <SelectItem value="rabbit">Rabbit</SelectItem>
                          <SelectItem value="hamster">Hamster</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="breedEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Breed Name (English)</FormLabel>
                      <FormControl>
                        <Input placeholder="Golden Retriever" {...field} data-testid="input-breed-name-en" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="breedZh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Breed Name (Chinese)</FormLabel>
                      <FormControl>
                        <Input placeholder="金毛尋回犬" {...field} data-testid="input-breed-name-zh" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="countryCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country (Optional)</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === "GLOBAL" ? null : value)} 
                        value={field.value || "GLOBAL"}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-breed-country">
                            <SelectValue placeholder="Global (all countries)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="GLOBAL">Global (all countries)</SelectItem>
                          {countries.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.flag} {country.nameEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isCommon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Common Breed</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value === "true")} value={String(field.value)}>
                        <FormControl>
                          <SelectTrigger data-testid="select-breed-common">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Common</SelectItem>
                          <SelectItem value="false">Uncommon</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value === "true")} value={String(field.value)}>
                        <FormControl>
                          <SelectTrigger data-testid="select-breed-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit-breed">
                  {isPending ? "Saving..." : editingBreed ? "Update" : "Create"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Species</TableHead>
            <TableHead>Breed (EN)</TableHead>
            <TableHead>Breed (ZH)</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Common</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {breeds.map((breed) => {
            const country = countries.find((c) => c.code === breed.countryCode);
            return (
              <TableRow key={breed.id} data-testid={`row-breed-${breed.id}`}>
                <TableCell className="capitalize">{breed.species}</TableCell>
                <TableCell>{breed.breedEn}</TableCell>
                <TableCell>{breed.breedZh}</TableCell>
                <TableCell>
                  {breed.countryCode ? (
                    <>
                      {country?.flag} {country?.nameEn}
                    </>
                  ) : (
                    <span className="text-muted-foreground">Global</span>
                  )}
                </TableCell>
                <TableCell>
                  {breed.isCommon ? (
                    <span className="text-green-600">Common</span>
                  ) : (
                    <span className="text-gray-400">Uncommon</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className={breed.active ? "text-green-600" : "text-gray-400"}>
                    {breed.active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(breed)}
                      data-testid={`button-edit-breed-${breed.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate(breed.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-breed-${breed.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
