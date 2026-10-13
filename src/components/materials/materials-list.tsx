"use client";

import React, { useState, useMemo } from "react";
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Edit2,
  Archive,
  ArchiveRestore,
  Trash2,
  Tag,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Material, MaterialCategory } from "@/types/database";
import { MaterialDialog } from "@/components/materials/material-dialog";
import { CategoryDialog } from "@/components/materials/category-dialog";
import { toggleArchiveMaterial, deleteMaterial } from "@/features/materials/actions";
import { formatCurrency, formatNumber } from "@/lib/utils/currency";
import { toast } from "sonner";

interface MaterialsListProps {
  initialMaterials: Material[];
  categories: MaterialCategory[];
  currency?: string;
}

export function MaterialsList({
  initialMaterials,
  categories,
  currency = "CRC",
}: MaterialsListProps) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("active");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<Material | null>(null);

  // Filtrado reactivo en cliente
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.description && m.description.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory =
        selectedCategory === "all" ||
        (selectedCategory === "none" && !m.category_id) ||
        m.category_id === selectedCategory;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !m.is_archived) ||
        (statusFilter === "archived" && m.is_archived);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [materials, search, selectedCategory, statusFilter]);

  async function handleToggleArchive(material: Material) {
    try {
      const nextState = !material.is_archived;
      const res = await toggleArchiveMaterial(material.id, nextState);
      if (res.success) {
        setMaterials((prev) =>
          prev.map((item) =>
            item.id === material.id ? { ...item, is_archived: nextState } : item
          )
        );
        toast.success(nextState ? "Material archivado" : "Material reactivado");
      } else {
        toast.error("Error al actualizar material", { description: res.error });
      }
    } catch {
      toast.error("Error inesperado");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de que deseas eliminar este material?")) return;

    try {
      const res = await deleteMaterial(id);
      if (res.success) {
        setMaterials((prev) => prev.filter((item) => item.id !== id));
        toast.success("Material eliminado");
      } else {
        toast.error("Error al eliminar material", { description: res.error });
      }
    } catch {
      toast.error("Error inesperado");
    }
  }

  return (
    <div className="space-y-6">
      {/* Informative Guidance Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl border bg-muted/30 text-sm">
        <HelpCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-muted-foreground text-xs leading-relaxed">
          <strong className="text-foreground">Nota sobre el catálogo:</strong> Los materiales
          registrados aquí sirven para determinar el costo por unidad de medida (ud, g, ml, cm, etc.).
          No constituyen un control de inventario de existencias físicas; por tanto, al calcular productos
          no se descontará stock automáticamente.
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              <SelectItem value="none">Sin categoría</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="archived">Archivados</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <CategoryDialog />
          <Button
            onClick={() => {
              setMaterialToEdit(null);
              setDialogOpen(true);
            }}
            className="gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Material</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {filteredMaterials.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <Boxes className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
            <h3 className="font-semibold text-base">No se encontraron materiales</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {search || selectedCategory !== "all"
                ? "Prueba cambiando los filtros de búsqueda o categoría."
                : "Agrega tu primer insumo o materia prima para comenzar a realizar cálculos."}
            </p>
            {!search && selectedCategory === "all" && (
              <Button
                size="sm"
                onClick={() => {
                  setMaterialToEdit(null);
                  setDialogOpen(true);
                }}
                className="gap-2 mt-2"
              >
                <Plus className="h-4 w-4" />
                Registrar Insumo
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre / Categoría</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead className="text-right">Compra Total</TableHead>
                <TableHead className="text-right">Cantidad Adquirida</TableHead>
                <TableHead className="text-right font-semibold">Costo Unitario</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.map((mat) => (
                <TableRow key={mat.id} className={mat.is_archived ? "opacity-60 bg-muted/20" : ""}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{mat.name}</span>
                      {mat.category ? (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Tag className="h-3 w-3" />
                          {mat.category.name}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">Sin categoría</span>
                      )}
                      {mat.description && (
                        <span className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                          {mat.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {mat.unit}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(mat.total_purchase_cost, { currency })}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(mat.purchased_quantity)} {mat.unit}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(mat.unit_cost, {
                      currency,
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4,
                    })}{" "}
                    <span className="text-xs font-normal text-muted-foreground">/{mat.unit}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    {mat.is_archived ? (
                      <Badge variant="secondary" className="text-[10px]">
                        Archivado
                      </Badge>
                    ) : (
                      <Badge variant="success" className="text-[10px]">
                        Activo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Editar"
                        onClick={() => {
                          setMaterialToEdit(mat);
                          setDialogOpen(true);
                        }}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title={mat.is_archived ? "Reactivar" : "Archivar"}
                        onClick={() => handleToggleArchive(mat)}
                      >
                        {mat.is_archived ? (
                          <ArchiveRestore className="h-3.5 w-3.5 text-blue-600" />
                        ) : (
                          <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Eliminar"
                        onClick={() => handleDelete(mat.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <MaterialDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        materialToEdit={materialToEdit}
        categories={categories}
        currency={currency}
        onSuccess={() => {
          // Revalidación se encarga Next.js en servidor
          window.location.reload();
        }}
      />
    </div>
  );
}

