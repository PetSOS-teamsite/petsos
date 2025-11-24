import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  Search, 
  RefreshCw, 
  Settings,
  Building2,
  Users,
  PawPrint,
  Edit,
  Trash2,
  Calendar,
  Ruler,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Pet, User, Clinic } from "@shared/schema";
import { format } from "date-fns";

export default function AdminPetsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    species: "",
    breed: "",
    age: 0,
    weight: "",
    medicalNotes: "",
  });
  const itemsPerPage = 20;
  const { toast } = useToast();

  const { data: pets, isLoading: petsLoading } = useQuery<Pet[]>({
    queryKey: ["/api/admin/pets"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: clinics } = useQuery<Clinic[]>({
    queryKey: ["/api/clinics"],
  });

  const stats = {
    total: pets?.length ?? 0,
    dogs: (pets?.filter(p => p.species.toLowerCase() === 'dog') ?? []).length,
    cats: (pets?.filter(p => p.species.toLowerCase() === 'cat') ?? []).length,
    others: (pets?.filter(p => !['dog', 'cat'].includes(p.species.toLowerCase())) ?? []).length,
  };

  // Filter and search logic
  const filteredPets = pets?.filter(pet => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const nameMatch = pet.name.toLowerCase().includes(search);
      const breedMatch = pet.breed?.toLowerCase().includes(search);
      if (!nameMatch && !breedMatch) return false;
    }

    // Species filter
    if (speciesFilter !== "all" && pet.species.toLowerCase() !== speciesFilter.toLowerCase()) return false;

    return true;
  }) ?? [];

  // Pagination
  const totalPages = Math.ceil(filteredPets.length / itemsPerPage);
  const paginatedPets = filteredPets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/pets"] });
  };

  const handleEdit = (pet: Pet) => {
    setSelectedPet(pet);
    setEditForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || "",
      age: pet.age || 0,
      weight: pet.weight || "",
      medicalNotes: pet.medicalNotes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (pet: Pet) => {
    setSelectedPet(pet);
    setIsDeleteDialogOpen(true);
  };

  const updateMutation = useMutation({
    mutationFn: ({ petId, data }: { petId: string; data: Partial<Pet> }) =>
      apiRequest("PATCH", `/api/pets/${petId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pets"] });
      setIsEditDialogOpen(false);
      setSelectedPet(null);
      toast({ title: "Pet updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating pet",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (petId: string) =>
      apiRequest("DELETE", `/api/pets/${petId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pets"] });
      setIsDeleteDialogOpen(false);
      setSelectedPet(null);
      toast({ title: "Pet deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting pet",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleSubmitUpdate = () => {
    if (!selectedPet) return;
    
    updateMutation.mutate({
      petId: selectedPet.id,
      data: {
        ...editForm,
        age: editForm.age || null,
      },
    });
  };

  const handleConfirmDelete = () => {
    if (!selectedPet) return;
    deleteMutation.mutate(selectedPet.id);
  };

  const getOwnerName = (userId: string) => {
    const user = users?.find(u => u.id === userId);
    return user?.name || user?.email || "Unknown";
  };

  const getClinicName = (clinicId: string | null) => {
    if (!clinicId) return "N/A";
    const clinic = clinics?.find(c => c.id === clinicId);
    return clinic ? clinic.name : clinicId;
  };

  const getSpeciesBadge = (species: string) => {
    const lower = species.toLowerCase();
    if (lower === 'dog') {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">🐕 Dog</Badge>;
    }
    if (lower === 'cat') {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">🐱 Cat</Badge>;
    }
    if (lower === 'bird') {
      return <Badge variant="secondary" className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200">🐦 Bird</Badge>;
    }
    if (lower === 'rabbit') {
      return <Badge variant="secondary" className="bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">🐰 Rabbit</Badge>;
    }
    return <Badge variant="outline">{species}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Pet Management
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage pet profiles and medical information
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                data-testid="button-refresh"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Link href="/admin/users">
                <Button variant="outline" size="sm" data-testid="button-admin-users">
                  <Users className="h-4 w-4 mr-2" />
                  Users
                </Button>
              </Link>
              <Link href="/admin/clinics">
                <Button variant="outline" size="sm" data-testid="button-admin-clinics">
                  <Building2 className="h-4 w-4 mr-2" />
                  Clinics
                </Button>
              </Link>
              <Link href="/admin/config">
                <Button variant="outline" size="sm" data-testid="button-admin-config">
                  <Settings className="h-4 w-4 mr-2" />
                  Config
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <PawPrint className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Pets</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-pets">
                      {stats.total}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <span className="text-2xl">🐕</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Dogs</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.dogs}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <span className="text-2xl">🐱</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Cats</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.cats}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Other Pets</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.others}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="max-w-7xl mx-auto mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by pet name or breed..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>

                <Select value={speciesFilter} onValueChange={(value) => {
                  setSpeciesFilter(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger data-testid="select-species-filter">
                    <SelectValue placeholder="Filter by species" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Species</SelectItem>
                    <SelectItem value="dog">Dogs</SelectItem>
                    <SelectItem value="cat">Cats</SelectItem>
                    <SelectItem value="bird">Birds</SelectItem>
                    <SelectItem value="rabbit">Rabbits</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pets Table */}
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Pets ({filteredPets.length})</span>
                {totalPages > 1 && (
                  <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {petsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : paginatedPets.length === 0 ? (
                <div className="text-center py-12">
                  <PawPrint className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No pets found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Species</TableHead>
                          <TableHead>Breed</TableHead>
                          <TableHead>Age</TableHead>
                          <TableHead>Weight</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Last Clinic</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedPets.map((pet) => (
                          <TableRow key={pet.id} data-testid={`row-pet-${pet.id}`}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <PawPrint className="h-4 w-4 text-gray-400" />
                                {pet.name}
                              </div>
                            </TableCell>
                            <TableCell>{getSpeciesBadge(pet.species)}</TableCell>
                            <TableCell>
                              {pet.breed || <span className="text-gray-400">Unknown</span>}
                            </TableCell>
                            <TableCell>
                              {pet.age ? (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-gray-400" />
                                  {pet.age} yrs
                                </div>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {pet.weight ? (
                                <div className="flex items-center gap-2">
                                  <Ruler className="h-4 w-4 text-gray-400" />
                                  {pet.weight} kg
                                </div>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                              {getOwnerName(pet.userId)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                              {getClinicName(pet.lastVisitHospitalId}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(pet.createdAt), 'MMM d, yyyy')}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(pet)}
                                  data-testid={`button-edit-${pet.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(pet)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  data-testid={`button-delete-${pet.id}`}
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

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        data-testid="button-prev-page"
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        data-testid="button-next-page"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit Pet Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent data-testid="dialog-edit-pet">
          <DialogHeader>
            <DialogTitle>Edit Pet</DialogTitle>
            <DialogDescription>
              Update pet information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Pet Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                data-testid="input-edit-name"
              />
            </div>
            <div>
              <Label htmlFor="species">Species</Label>
              <Select value={editForm.species} onValueChange={(value) => setEditForm({ ...editForm, species: value })}>
                <SelectTrigger data-testid="select-edit-species">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dog">Dog</SelectItem>
                  <SelectItem value="Cat">Cat</SelectItem>
                  <SelectItem value="Bird">Bird</SelectItem>
                  <SelectItem value="Rabbit">Rabbit</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="breed">Breed</Label>
              <Input
                id="breed"
                value={editForm.breed}
                onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })}
                data-testid="input-edit-breed"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Age (years)</Label>
                <Input
                  id="age"
                  type="number"
                  value={editForm.age}
                  onChange={(e) => setEditForm({ ...editForm, age: parseInt(e.target.value) || 0 })}
                  data-testid="input-edit-age"
                />
              </div>
              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  value={editForm.weight}
                  onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                  data-testid="input-edit-weight"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="medicalNotes">Medical Notes</Label>
              <Textarea
                id="medicalNotes"
                value={editForm.medicalNotes}
                onChange={(e) => setEditForm({ ...editForm, medicalNotes: e.target.value })}
                rows={4}
                data-testid="textarea-edit-medical-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button onClick={handleSubmitUpdate} disabled={updateMutation.isPending} data-testid="button-save-pet">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent data-testid="dialog-delete-pet">
          <DialogHeader>
            <DialogTitle>Delete Pet</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this pet? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} data-testid="button-cancel-delete">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete} 
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Pet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
