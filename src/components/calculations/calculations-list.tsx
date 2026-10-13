"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Wrench,
  Search,
  Filter,
  Eye,
  Edit2,
  Copy,
  Archive,
  ArchiveRestore,
  Trash2,
  Calendar,
  PlusCircle,
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
import { CalculationWithDetails, CalculationType } from "@/types/database";
import { CalculationDetailModal } from "@/components/calculations/calculation-detail-modal";
import {
  duplicateCalculation,
  toggleArchiveCalculation,
  deleteCalculation,
} from "@/features/calculations/actions";
import { formatCurrency } from "@/lib/utils/currency";
import { toast } from "sonner";

interface CalculationsListProps {
  initialCalculations: CalculationWithDetails[];
  currency?: string;
}

export function CalculationsList({
  initialCalculations,
  currency = "CRC",
}: CalculationsListProps) {
  const router = useRouter();
  const [calculations, setCalculations] = useState<CalculationWithDetails[]>(initialCalculations);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | CalculationType>("all");
  const [statusFilter, setStatusFilter] = useState<"active" | "archived" | "all">("active");

  const [selectedCalc, setSelectedCalc] = useState<CalculationWithDetails | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Filtros reactivos
  const filteredCalculations = useMemo(() => {
    return calculations.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(search.toLowerCase()));

      const matchesType = typeFilter === "all" || c.type === typeFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !c.is_archived) ||
        (statusFilter === "archived" && c.is_archived);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [calculations, search, typeFilter, statusFilter]);

  async function handleDuplicate(id: string) {
    try {
      const res = await duplicateCalculation(id);
      if (res.success && res.data) {
        toast.success("Cálculo duplicado correctamente");
        setCalculations((prev) => [res.data!, ...prev]);
        setModalOpen(false);
      } else {
        toast.error("Error al duplicar", { description: res.error });
      }
    } catch {
      toast.error("Error inesperado");
    }
  }

  async function handleToggleArchive(calc: CalculationWithDetails) {
    try {
      const nextState = !calc.is_archived;
      const res = await toggleArchiveCalculation(calc.id, nextState);
      if (res.success) {
        setCalculations((prev) =>
          prev.map((item) =>
            item.id === calc.id ? { ...item, is_archived: nextState } : item
          )
        );
        toast.success(nextState ? "Cálculo archivado" : "Cálculo reactivado");
      } else {
        toast.error("Error al actualizar", { description: res.error });
      }
    } catch {
      toast.error("Error inesperado");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Deseas eliminar definitivamente este registro de tu historial?")) return;

    try {
      const res = await deleteCalculation(id);
      if (res.success) {
        setCalculations((prev) => prev.filter((item) => item.id !== id));
        toast.success("Cálculo eliminado");
      } else {
        toast.error("Error al eliminar", { description: res.error });
      }
    } catch {
      toast.error("Error inesperado");
    }
  }

  return (
    <div className="space-y-6">
      {/* Barra de Filtros y Acciones */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cotizaciones por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={typeFilter} onValueChange={(val: any) => setTypeFilter(val)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="product">Productos</SelectItem>
              <SelectItem value="service">Servicios</SelectItem>
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

        <Link href="/calculator">
          <Button className="gap-2 shadow-sm w-full sm:w-auto">
            <PlusCircle className="h-4 w-4" />
            <span>Nuevo Cálculo</span>
          </Button>
        </Link>
      </div>

      {/* Tabla de Cálculos */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {filteredCalculations.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <Package className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
            <h3 className="font-semibold text-base">No se encontraron cálculos</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {search || typeFilter !== "all"
                ? "Prueba cambiando los términos de búsqueda o filtros."
                : "Aún no has generado cotizaciones o cálculos en tu cuenta."}
            </p>
            {!search && typeFilter === "all" && (
              <Link href="/calculator">
                <Button size="sm" className="gap-2 mt-2">
                  <PlusCircle className="h-4 w-4" />
                  Crear mi primer cálculo
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre / Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Costo Unitario</TableHead>
                <TableHead className="text-right">Precio Sugerido</TableHead>
                <TableHead>Ganancia</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCalculations.map((calc) => (
                <TableRow key={calc.id} className={calc.is_archived ? "opacity-60 bg-muted/20" : ""}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{calc.name}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {new Date(calc.created_at).toLocaleDateString("es-CR")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {calc.type === "product" ? (
                      <Badge variant="success">Producto ({calc.output_quantity} uds)</Badge>
                    ) : (
                      <Badge variant="info">Servicio</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatCurrency(calc.unit_cost, { currency })}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(calc.suggested_unit_price, { currency })}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium">
                      {calc.profit_percentage}% ({calc.profit_method === "markup" ? "Markup" : "Margen"})
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {calc.is_archived ? (
                      <Badge variant="secondary" className="text-[10px]">
                        Archivado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-600/30">
                        Activo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-foreground"
                        title="Ver Desglose Completo"
                        onClick={() => {
                          setSelectedCalc(calc);
                          setModalOpen(true);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>

                      <Link href={`/calculator?id=${calc.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-foreground"
                          title="Editar Cálculo"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-foreground"
                        title="Duplicar"
                        onClick={() => handleDuplicate(calc.id)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title={calc.is_archived ? "Reactivar" : "Archivar"}
                        onClick={() => handleToggleArchive(calc)}
                      >
                        {calc.is_archived ? (
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
                        onClick={() => handleDelete(calc.id)}
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

      <CalculationDetailModal
        calculation={selectedCalc}
        open={modalOpen}
        onOpenChange={setModalOpen}
        currency={currency}
        onDuplicate={handleDuplicate}
      />
    </div>
  );
}

