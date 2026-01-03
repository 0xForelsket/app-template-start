import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLayout } from "@/components/ui/page-layout";
import { getSession } from "@/lib/session";
import { FolderKanban, Settings, Users } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <PageLayout title={`Welcome, ${session?.user?.name || "User"}`}>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View and manage your projects
            </p>
            <Button asChild size="sm">
              <Link href="/projects">View Projects</Link>
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
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none text-muted-foreground">
          <p>
            This is a factory app template. Use it to build focused
            factory/industrial applications like:
          </p>
          <ul>
            <li>Training & Certification Tracking</li>
            <li>Problem Solving / Corrective Actions</li>
            <li>Safety Incident Reporting</li>
            <li>5S / Lean Audits</li>
            <li>Tool Crib / Checkout Systems</li>
          </ul>
          <p>
            The Projects domain is included as an example. Replace it with your
            own domain entities following the patterns in <code>CLAUDE.md</code>{" "}
            and <code>PATTERNS.md</code>.
          </p>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
