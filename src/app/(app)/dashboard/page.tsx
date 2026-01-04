import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLayout } from "@/components/ui/page-layout";
import { getSession } from "@/lib/session";
import { BookOpen, Settings, Users } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <PageLayout title={`Welcome, ${session?.user?.name || "User"}`}>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skill Catalog</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Browse and manage skills by department and area
            </p>
            <Button asChild size="sm">
              <Link href="/skills">View Catalog</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Manage user accounts and permissions
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/users">Manage Users</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settings</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure system settings
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/settings">Open Settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Learning Management System</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none text-muted-foreground">
          <p>
            Welcome to the Factory Learning Management System. This platform is
            designed to track and manage workforce skills, certifications, and
            training across different departments and areas.
          </p>
          <ul>
            <li>
              <strong>Departments:</strong> High-level organizational units
              (e.g., Quality, Production).
            </li>
            <li>
              <strong>Areas:</strong> Specific functional areas within
              departments (e.g., IQC, IPQC, Assembly Line A).
            </li>
            <li>
              <strong>Skills:</strong> Specific competencies required for
              efficient factory operations.
            </li>
          </ul>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
