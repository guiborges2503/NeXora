import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, TrendingUp, Users, DollarSign, Package, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const dashboards = [
  {
    id: 1,
    name: "Vendas & Receita",
    category: "Comercial",
    lastUpdated: "Há 2 horas",
    views: 1234,
    icon: DollarSign,
    color: "text-green-600 bg-green-50",
  },
  {
    id: 2,
    name: "Marketing Digital",
    category: "Marketing",
    lastUpdated: "Há 5 horas",
    views: 856,
    icon: TrendingUp,
    color: "text-blue-600 bg-blue-50",
  },
  {
    id: 3,
    name: "Recursos Humanos",
    category: "RH",
    lastUpdated: "Há 1 dia",
    views: 432,
    icon: Users,
    color: "text-purple-600 bg-purple-50",
  },
  {
    id: 4,
    name: "Estoque & Logística",
    category: "Operações",
    lastUpdated: "Há 3 horas",
    views: 678,
    icon: Package,
    color: "text-orange-600 bg-orange-50",
  },
];

export function HomePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Dashboards</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie todos os seus painéis de BI
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/dashboards/create">
            <Plus className="w-4 h-4 mr-2" />
            Novo Dashboard
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar dashboards..."
                className="pl-10 bg-background border-border"
              />
            </div>
            <Select>
              <SelectTrigger className="w-48 bg-background border-border">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="commercial">Comercial</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="hr">RH</SelectItem>
                <SelectItem value="operations">Operações</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-48 bg-background border-border">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="views">Mais visualizados</SelectItem>
                <SelectItem value="name">Nome A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {dashboards.map((dashboard) => {
          const Icon = dashboard.icon;
          return (
            <Card
              key={dashboard.id}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${dashboard.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 hover:bg-accent rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Compartilhar</DropdownMenuItem>
                      <DropdownMenuItem>Duplicar</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-semibold mb-1">{dashboard.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {dashboard.category}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{dashboard.lastUpdated}</span>
                  <span>{dashboard.views} views</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button asChild variant="outline" className="w-full" size="sm">
                  <Link to={`/dashboards/${dashboard.id}`}>Visualizar</Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
