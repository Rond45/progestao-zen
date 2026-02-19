import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Phone, Tag, MoreHorizontal } from "lucide-react";

const mockClients = [
  { id: 1, name: "Carlos Silva", phone: "(11) 99123-4567", tags: ["VIP"], visits: 24, lastVisit: "17/02/2026", spent: "R$ 1.920" },
  { id: 2, name: "Pedro Santos", phone: "(11) 98765-4321", tags: [], visits: 12, lastVisit: "15/02/2026", spent: "R$ 840" },
  { id: 3, name: "Andre Lima", phone: "(11) 97654-3210", tags: ["Novo"], visits: 2, lastVisit: "10/02/2026", spent: "R$ 120" },
  { id: 4, name: "Lucas Oliveira", phone: "(11) 96543-2109", tags: [], visits: 8, lastVisit: "12/02/2026", spent: "R$ 560" },
  { id: 5, name: "Marcos Costa", phone: "(11) 95432-1098", tags: ["VIP"], visits: 30, lastVisit: "18/02/2026", spent: "R$ 2.340" },
  { id: 6, name: "Felipe Souza", phone: "(11) 94321-0987", tags: [], visits: 5, lastVisit: "08/02/2026", spent: "R$ 350" },
  { id: 7, name: "Bruno Dias", phone: "(11) 93210-9876", tags: ["Faltou"], visits: 3, lastVisit: "01/02/2026", spent: "R$ 180" },
  { id: 8, name: "Thiago Rocha", phone: "(11) 92109-8765", tags: [], visits: 15, lastVisit: "16/02/2026", spent: "R$ 1.050" },
];

const tagColors: Record<string, string> = {
  "VIP": "bg-primary/15 text-primary",
  "Novo": "bg-emerald-500/15 text-emerald-400",
  "Faltou": "bg-red-500/15 text-red-400",
};

const Clientes = () => {
  const [search, setSearch] = useState("");

  const filtered = mockClients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">{mockClients.length} clientes cadastrados</p>
        </div>
        <Button variant="emerald" size="sm">
          <Plus className="h-4 w-4" />
          Novo cliente
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="pl-9 bg-card border-border text-foreground"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Cliente</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden sm:table-cell">Telefone</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Tags</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden lg:table-cell">Visitas</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden lg:table-cell">Ultima visita</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Total gasto</th>
                <th className="px-3 py-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((client) => (
                <tr key={client.id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-muted-foreground">{client.name.split(" ").map(n => n[0]).join("")}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{client.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {client.phone}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <div className="flex gap-1.5">
                      {client.tags.map((tag) => (
                        <span key={tag} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${tagColors[tag] || "bg-secondary text-muted-foreground"}`}>
                          <Tag className="h-2.5 w-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground hidden lg:table-cell">{client.visits}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground hidden lg:table-cell">{client.lastVisit}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-foreground text-right">{client.spent}</td>
                  <td className="px-3 py-3.5">
                    <button className="text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Clientes;
