import { Home, BarChart3, Star, FolderKanban, Settings } from "lucide-react";
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

const mainItems = [
  { title: "홈", url: "/", icon: Home },
  { title: "분석 결과", url: "/results", icon: BarChart3 },
];

const managementItems = [
  { title: "키워드 관리", url: "/", icon: Star, badge: "키워드" },
  { title: "프로젝트 관리", url: "#", icon: FolderKanban, disabled: true, badge: "Phase 2" },
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

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">
            메인
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
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

        {/* Management Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">
            관리
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild={!item.disabled}
                    isActive={!item.disabled && isActive(item.url)}
                    disabled={item.disabled}
                  >
                    {item.disabled ? (
                      <div className="flex items-center gap-2 text-sidebar-foreground/40 cursor-not-allowed">
                        <item.icon className="h-4 w-4" />
                        {open && (
                          <>
                            <span className="flex-1">{item.title}</span>
                            {item.badge && (
                              <span className="text-xs bg-sidebar-accent px-2 py-0.5 rounded">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <NavLink
                        to={item.url}
                        className="hover:bg-sidebar-accent text-sidebar-foreground"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                      >
                        <item.icon className="h-4 w-4" />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                    )}
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
