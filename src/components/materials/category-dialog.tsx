"use client";

import React, { useState } from "react";
import { Loader2, Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createCategory } from "@/features/materials/actions";
import { toast } from "sonner";
import { MaterialCategory } from "@/types/database";

interface CategoryDialogProps {
  onCategoryCreated?: (category: MaterialCategory) => void;
}

export function CategoryDialog({ onCategoryCreated }: CategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await createCategory(name.trim());
      if (res.success && res.data) {
        toast.success("Categoría creada");
        setName("");
        setOpen(false);
        if (onCategoryCreated) {
          onCategoryCreated(res.data);
        }
      } else {
        toast.error("Error al crear categoría", { description: res.error });
      }
    } catch {
      toast.error("Error inesperado al crear categoría");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Tag className="h-4 w-4" />
          <span>Nueva Categoría</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Categoría de Materiales</DialogTitle>
          <DialogDescription>
            Organiza tus insumos agrupándolos (ej. Filamentos, Resinas, Químicos, Empaques, etc.)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="category_name">Nombre de la categoría</Label>
            <Input
              id="category_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Resinas y Polímeros"
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Creando...</span>
                </>
              ) : (
                <span>Guardar Categoría</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

