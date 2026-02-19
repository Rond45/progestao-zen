import { Button } from "@/components/ui/button";
import { Plus, Package, MoreHorizontal } from "lucide-react";

const products = [
  { id: 1, name: "Pomada modeladora", category: "Finalizacao", price: "R$ 45", cost: "R$ 18", stock: 12 },
  { id: 2, name: "Oleo para barba", category: "Barba", price: "R$ 55", cost: "R$ 22", stock: 8 },
  { id: 3, name: "Shampoo anticaspa", category: "Cabelo", price: "R$ 35", cost: "R$ 14", stock: 15 },
  { id: 4, name: "Cera para cabelo", category: "Finalizacao", price: "R$ 40", cost: "R$ 16", stock: 6 },
  { id: 5, name: "Balm pos-barba", category: "Barba", price: "R$ 38", cost: "R$ 15", stock: 10 },
];

const Produtos = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-sm text-muted-foreground mt-1">{products.length} produtos cadastrados</p>
        </div>
        <Button variant="gold" size="sm">
          <Plus className="h-4 w-4" />
          Novo produto
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Produto</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden sm:table-cell">Categoria</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Preco</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Custo</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Estoque</th>
              <th className="px-3 py-3 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-surface-hover transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{p.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground hidden sm:table-cell">{p.category}</td>
                <td className="px-5 py-3.5 text-sm font-medium text-foreground text-right">{p.price}</td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground text-right hidden md:table-cell">{p.cost}</td>
                <td className="px-5 py-3.5 text-right hidden md:table-cell">
                  <span className={`text-sm font-medium ${p.stock <= 6 ? "text-primary" : "text-foreground"}`}>{p.stock}</span>
                </td>
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
  );
};

export default Produtos;
