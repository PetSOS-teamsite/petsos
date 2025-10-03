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
import { useTranslation } from "@/hooks/useTranslation";
import { PawPrint, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import type { Pet } from "@shared/schema";

// Schema factory to access translation function
const createPetSchema = (t: (key: string, fallback: string) => string) => z.object({
  name: z.string().min(1, t("pets.validation.name_required", "Pet name is required")),
  species: z.string().min(1, t("pets.validation.species_required", "Species is required")),
  breed: z.string().optional(),
  age: z.coerce.number().positive().optional(),
  weight: z.coerce.number().positive().optional(),
  medicalNotes: z.string().optional(),
});

// Type helper
type PetSchemaType = ReturnType<typeof createPetSchema>;
type PetFormData = z.infer<PetSchemaType>;

export default function PetsPage() {
  const userId = "temp-user-id";
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const petSchema = createPetSchema(t);
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
      const payload = {
        ...data,
        userId,
        weight: data.weight !== undefined ? String(data.weight) : undefined,
      };
      const response = await apiRequest(
        'POST',
        '/api/pets',
        payload
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'pets'] });
      toast({
        title: t("pets.success.add", "Pet added successfully!"),
        description: t("pets.success.add_desc", "Your pet has been added to your profile."),
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: t("pets.error.add", "Failed to add pet"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PetFormData }) => {
      const payload = {
        ...data,
        weight: data.weight !== undefined ? String(data.weight) : undefined,
      };
      const response = await apiRequest(
        'PATCH',
        `/api/pets/${id}`,
        payload
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'pets'] });
      toast({
        title: t("pets.success.update", "Pet updated successfully!"),
        description: t("pets.success.update_desc", "Your pet's information has been updated."),
      });
      setIsDialogOpen(false);
      setEditingPet(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: t("pets.error.update", "Failed to update pet"),
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
        title: t("pets.success.delete", "Pet removed"),
        description: t("pets.success.delete_desc", "Your pet has been removed from your profile."),
      });
      setDeletingPetId(null);
    },
    onError: (error: Error) => {
      toast({
        title: t("pets.error.delete", "Failed to delete pet"),
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
              {t("pets.back_to_profile", "Back to Profile")}
            </Button>
          </Link>
        </div>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PawPrint className="w-6 h-6" />
                {t("pets.title", "My Pets")}
              </CardTitle>
              <CardDescription>
                {t("pets.desc", "Manage your pets for faster emergency requests")}
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} data-testid="button-add-pet">
                  <Plus className="w-4 h-4 mr-2" />
                  {t("pets.add", "Add Pet")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingPet ? t("pets.edit", "Edit Pet") : t("pets.add_new", "Add New Pet")}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("pets.name", "Name")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t("pets.name_placeholder", "Fluffy")}
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
                          <FormLabel>{t("pets.species", "Species")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t("pets.species_placeholder", "Dog, Cat, etc.")}
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
                          <FormLabel>{t("pets.breed", "Breed (Optional)")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t("pets.breed_placeholder", "Golden Retriever")}
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
                            <FormLabel>{t("pets.age", "Age (Optional)")}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                placeholder={t("pets.age_placeholder", "3")}
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
                            <FormLabel>{t("pets.weight", "Weight (kg, Optional)")}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                step="0.1"
                                placeholder={t("pets.weight_placeholder", "10.5")}
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
                          <FormLabel>{t("pets.medical_notes", "Medical Notes (Optional)")}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={t("pets.medical_notes_placeholder", "Allergies, medications, conditions...")}
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
                        {t("button.cancel", "Cancel")}
                      </Button>
                      <Button
                        type="submit"
                        disabled={createPetMutation.isPending || updatePetMutation.isPending}
                        data-testid="button-save-pet"
                      >
                        {createPetMutation.isPending || updatePetMutation.isPending
                          ? t("pets.saving", "Saving...")
                          : editingPet
                          ? t("pets.update", "Update Pet")
                          : t("pets.add", "Add Pet")}
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
                {t("loading.pets", "Loading pets...")}
              </div>
            ) : pets.length === 0 ? (
              <div className="text-center py-12">
                <PawPrint className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {t("pets.no_pets", "No pets added yet")}
                </p>
                <Button onClick={handleAddNew} data-testid="button-add-first-pet">
                  <Plus className="w-4 h-4 mr-2" />
                  {t("pets.add_first", "Add Your First Pet")}
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
                        {pet.age && <div>{t("pets.age_years", "Age: {age} years").replace("{age}", String(pet.age))}</div>}
                        {pet.weight && <div>{t("pets.weight_kg", "Weight: {weight} kg").replace("{weight}", String(pet.weight))}</div>}
                        {pet.medicalNotes && (
                          <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-yellow-800 dark:text-yellow-200">
                            <strong>{t("pets.medical_label", "Medical:")}</strong> {pet.medicalNotes}
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
              <AlertDialogTitle>{t("pets.delete", "Delete Pet")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("pets.delete_confirm", "Are you sure you want to remove this pet from your profile? This action cannot be undone.")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">{t("button.cancel", "Cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletingPetId && deletePetMutation.mutate(deletingPetId)}
                className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                data-testid="button-confirm-delete"
              >
                {t("button.delete", "Delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
