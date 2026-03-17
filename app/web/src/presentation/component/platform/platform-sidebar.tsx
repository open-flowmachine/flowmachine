"use client";

import { OrganizationSwitcher } from "@daveyplate/better-auth-ui";
import {
  BotIcon,
  FileTextIcon,
  FolderGitIcon,
  HandCoinsIcon,
  InboxIcon,
  KanbanSquareIcon,
  KeyRoundIcon,
  ListTodoIcon,
  type LucideIcon,
  SquareMousePointerIcon,
  UserRoundPenIcon,
  WorkflowIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { config } from "@/infra/config/config";
import { Logo } from "@/presentation/component/extended-ui/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/presentation/component/ui/sidebar";

type NavigationItem = {
  title: string;
  href: string;
  Icon: LucideIcon;
};

export function PlatformSidebar() {
  const router = useRouter();

  return (
    <Sidebar className="py-1.5 pr-0 pl-1" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:!p-1.5"
              render={(props) => (
                <Link href="/platform" {...props}>
                  <Logo className="fill-sidebar-accent-foreground !size-5" />
                  <span className="font-semibold">Flow Machine</span>
                  <span className="text-muted-foreground ml-auto text-xs font-medium">
                    v.{config.app.version}
                  </span>
                </Link>
              )}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Personal</SidebarGroupLabel>
          <SidebarMenu>
            {getPersonalNavigationItems().map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={(props) => (
                    <Link href={item.href} {...props}>
                      <item.Icon />
                      <span>{item.title}</span>
                    </Link>
                  )}
                />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {getPlatformNavigationItems().map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={(props) => (
                    <Link href={item.href} {...props}>
                      <item.Icon />
                      <span>{item.title}</span>
                    </Link>
                  )}
                />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Integration</SidebarGroupLabel>
          <SidebarMenu>
            {getIntegrationNavigationItems().map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={(props) => (
                    <Link href={item.href} {...props}>
                      <item.Icon />
                      <span>{item.title}</span>
                    </Link>
                  )}
                />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Support</SidebarGroupLabel>
          <SidebarMenu>
            {getSupportNavigationItems().map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={(props) => (
                    <Link href={item.href} {...props}>
                      <item.Icon />
                      <span>{item.title}</span>
                    </Link>
                  )}
                />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <OrganizationSwitcher
              align="start"
              variant="outline"
              onSetActive={() => router.refresh()}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function getPersonalNavigationItems() {
  return [
    { title: "Inbox", href: "/platform/inbox", Icon: InboxIcon },
  ] as const satisfies NavigationItem[];
}

function getPlatformNavigationItems() {
  return [
    {
      title: "Project",
      href: "/platform/project",
      Icon: KanbanSquareIcon,
    },
    {
      title: "Issue",
      href: "/platform/issue",
      Icon: ListTodoIcon,
    },
    { title: "Workflow", href: "/platform/workflow", Icon: WorkflowIcon },
    {
      title: "Execution",
      href: "/platform/execution",
      Icon: SquareMousePointerIcon,
    },
    { title: "Document", href: "/platform/document", Icon: FileTextIcon },
  ] as const satisfies NavigationItem[];
}

function getIntegrationNavigationItems() {
  return [
    { title: "AI Agent", href: "/platform/ai-agent", Icon: BotIcon },
    {
      title: "Git Repository",
      href: "/platform/git-repository",
      Icon: FolderGitIcon,
    },
    { title: "Credential", href: "/platform/credential", Icon: KeyRoundIcon },
  ] as const satisfies NavigationItem[];
}

function getSupportNavigationItems() {
  return [
    { title: "Billing", href: "/platform/billing", Icon: HandCoinsIcon },
    {
      title: "Feedback",
      href: "/platform/feedback",
      Icon: UserRoundPenIcon,
    },
  ] as const satisfies NavigationItem[];
}
