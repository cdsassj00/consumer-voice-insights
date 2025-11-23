import { LayoutDashboard, FolderKanban, Settings, FileBarChart2 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const vocCollectionItems = [
  { title: "대시보드", url: "/", icon: LayoutDashboard },
  { title: "프로젝트 관리", url: "/projects", icon: FolderKanban },
];

const aiToolsItems = [
  { title: "리뷰 인사이트 분석기", url: "/review-insights", icon: FileBarChart2 },
];

const settingsItems = [
  { title: "설정", url: "#", icon: Settings, disabled: true },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar className="border-sidebar-border">
      <SidebarContent className="bg-sidebar-background">
        {/* Logo Section */}
        <div className="px-4 py-6">
          <h1 className="text-sidebar-foreground font-bold text-xl">
            {open ? "소비자 인사이트" : "소"}
          </h1>
          {open && (
            <p className="text-sidebar-foreground/60 text-xs mt-1">
              Consumer Insights Platform
            </p>
          )}
        </div>

        {/* VOC 실시간 수집 */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">
            📊 VOC 실시간 수집
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {vocCollectionItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent text-sidebar-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    >
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI 분석 도구 */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">
            🤖 AI 분석 도구
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {aiToolsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent text-sidebar-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    >
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings Section */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton disabled={item.disabled}>
                    <item.icon className="h-4 w-4" />
                    {open && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
