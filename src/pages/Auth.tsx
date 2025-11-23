import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Session } from "@supabase/supabase-js";
import { FlowBackground } from "@/components/FlowBackground";
import { MessageCircle, TrendingUp, Users } from "lucide-react";
const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [mainProduct, setMainProduct] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [showGoogleOnboarding, setShowGoogleOnboarding] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        // Check if this is a new Google OAuth user
        const pendingCompany = sessionStorage.getItem('pending_company_name');
        const pendingProduct = sessionStorage.getItem('pending_main_product');
        if (pendingCompany && pendingProduct) {
          // Create profile and first project for Google OAuth user
          try {
            // Check if profile already exists
            const {
              data: existingProfile
            } = await supabase.from('profiles').select('id').eq('id', session.user.id).maybeSingle();
            if (!existingProfile) {
              // Create profile
              await supabase.from('profiles').insert({
                id: session.user.id,
                company_name: pendingCompany,
                main_product: pendingProduct
              });

              // Create first project
              await supabase.from('projects').insert({
                user_id: session.user.id,
                name: `${pendingCompany} - ${pendingProduct}`,
                description: `${pendingProduct} 제품에 대한 소비자 VOC 분석 프로젝트`,
                project_type: 'product'
              });

              // Mark as first login for onboarding
              localStorage.setItem('first-login', 'true');
            }
          } catch (error) {
            console.error("Error creating profile/project:", error);
          }

          // Clear session storage
          sessionStorage.removeItem('pending_company_name');
          sessionStorage.removeItem('pending_main_product');
        }
        navigate("/");
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setSession(session);
      if (session) {
        navigate("/");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !companyName || !mainProduct) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive"
      });
      return;
    }
    if (password.length < 6) {
      toast({
        title: "비밀번호 오류",
        description: "비밀번호는 최소 6자 이상이어야 합니다.",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      const {
        data: authData,
        error: authError
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            company_name: companyName,
            main_product: mainProduct
          }
        }
      });
      if (authError) {
        if (authError.message.includes("already registered")) {
          toast({
            title: "회원가입 실패",
            description: "이미 가입된 이메일입니다. 로그인해주세요.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "회원가입 실패",
            description: authError.message,
            variant: "destructive"
          });
        }
        return;
      }
      if (authData.user) {
        // Create profile
        const {
          error: profileError
        } = await supabase.from('profiles').insert({
          id: authData.user.id,
          company_name: companyName,
          main_product: mainProduct
        });
        if (profileError) {
          console.error("Profile creation error:", profileError);
        }

        // Create first project automatically
        const {
          error: projectError
        } = await supabase.from('projects').insert({
          user_id: authData.user.id,
          name: `${companyName} - ${mainProduct}`,
          description: `${mainProduct} 제품에 대한 소비자 VOC 분석 프로젝트`,
          project_type: 'product'
        });
        if (projectError) {
          console.error("Project creation error:", projectError);
        }

        // Mark as first login for onboarding
        localStorage.setItem('first-login', 'true');
        toast({
          title: "회원가입 완료",
          description: "첫 프로젝트가 자동으로 생성되었습니다!"
        });
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        title: "오류 발생",
        description: "회원가입 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "입력 오류",
        description: "이메일과 비밀번호를 입력해주세요.",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "로그인 실패",
            description: "이메일 또는 비밀번호가 올바르지 않습니다.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "로그인 실패",
            description: error.message,
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "로그인 성공",
          description: "환영합니다!"
        });
      }
    } catch (error) {
      console.error("Signin error:", error);
      toast({
        title: "오류 발생",
        description: "로그인 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleGoogleSignInClick = () => {
    setShowGoogleOnboarding(true);
  };
  const handleGoogleOnboardingSubmit = async () => {
    if (!companyName || !mainProduct) {
      toast({
        title: "입력 오류",
        description: "회사명과 대표제품명을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    // Store temporarily for use after OAuth callback
    sessionStorage.setItem('pending_company_name', companyName);
    sessionStorage.setItem('pending_main_product', mainProduct);
    setIsLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      if (error) {
        toast({
          title: "구글 로그인 실패",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Google signin error:", error);
      toast({
        title: "오류 발생",
        description: "구글 로그인 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen relative overflow-hidden">
      <FlowBackground />
      
      {/* Softer overlay so background animation is clearly visible */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/40 via-background/20 to-background/40 backdrop-blur-[2px] pointer-events-none" />
      
      <div className="relative min-h-screen flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-center">
          {/* Left side - Marketing content */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8 text-center md:text-left">
            <div className="space-y-2 sm:space-y-3 lg:space-y-4 animate-fade-in">
              <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent leading-tight">
                소비자 VOC의
                <br />새로운 패러다임
              </h1>
              <p className="text-base sm:text-lg md:text-lg lg:text-xl text-muted-foreground max-w-lg mx-auto md:mx-0">
                이제 더 이상 그럴듯한 이야기가 아닌,
                <br className="hidden sm:inline" />
                <span className="text-foreground font-semibold">진짜 소비자의 목소리</span>를 수집하세요
              </p>
            </div>

            <div className="hidden md:grid space-y-4 sm:space-y-5 lg:space-y-6 mt-6 sm:mt-8 lg:mt-12">
              <div className="flex items-start gap-3 sm:gap-4 animate-fade-in" style={{
              animationDelay: '0.1s'
            }}>
                <div className="p-2 sm:p-2.5 lg:p-3 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                  <MessageCircle className="w-5 h-5 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-base sm:text-base lg:text-lg mb-0.5 sm:mb-1">실제 커뮤니티에서 수집</h3>
                  <p className="text-sm sm:text-sm lg:text-base text-muted-foreground">
                    공식 리뷰 사이트가 아닌, 소비자들이 진솔하게 의견을 나누는 커뮤니티 게시판에서 직접 수집합니다
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4 animate-fade-in" style={{
              animationDelay: '0.2s'
            }}>
                <div className="p-2 sm:p-2.5 lg:p-3 rounded-lg bg-blue-500/10 text-blue-500 flex-shrink-0">
                  <TrendingUp className="w-5 h-5 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-base sm:text-base lg:text-lg mb-0.5 sm:mb-1">AI 기반 심층 분석</h3>
                  <p className="text-sm sm:text-sm lg:text-base text-muted-foreground">
                    단순 키워드 통계를 넘어, 소비자 페르소나와 경쟁 포지셔닝까지 분석합니다
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4 animate-fade-in" style={{
              animationDelay: '0.3s'
            }}>
                <div className="p-2 sm:p-2.5 lg:p-3 rounded-lg bg-purple-500/10 text-purple-500 flex-shrink-0">
                  <Users className="w-5 h-5 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-base sm:text-base lg:text-lg mb-0.5 sm:mb-1">진짜 인사이트 발견</h3>
                  <p className="text-sm sm:text-sm lg:text-base text-muted-foreground">
                    꾸며진 후기가 아닌, 소비자들의 진실된 경험과 니즈를 파악하세요
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Auth card */}
          <Card className="w-full backdrop-blur-lg bg-card/95 shadow-2xl border-border/50 animate-scale-in">
            {/* Mobile-only header */}
            <div className="md:hidden px-4 pt-5 pb-3 text-center space-y-2 border-b border-border/50">
              <h2 className="text-xl font-bold bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
                소비자 VOC의 새로운 패러다임
              </h2>
              <p className="text-sm text-muted-foreground">
                진짜 소비자의 커뮤니티 토론에서<br />
                솔직한 의견을 수집합니다
              </p>
            </div>
            
            <CardHeader className="text-center px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
              <CardTitle className="text-xl sm:text-2xl">RealVOC</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                LLM AI로 수집된 리얼 소비자데이터를 분석까지 한번에
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
                  <TabsTrigger value="signin" className="text-sm sm:text-base">로그인</TabsTrigger>
                  <TabsTrigger value="signup" className="text-sm sm:text-base">회원가입</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-3 sm:space-y-4">
                    <div className="space-y-2">
                      <Input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} className="h-10 sm:h-11 text-sm sm:text-base" />
                    </div>
                    <div className="space-y-2">
                      <Input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} className="h-10 sm:h-11 text-sm sm:text-base" />
                    </div>
                    <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base" disabled={isLoading}>
                      {isLoading ? "로그인 중..." : "로그인"}
                    </Button>

                    <div className="relative my-4 sm:my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs sm:text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">또는</span>
                      </div>
                    </div>

                    <Button type="button" variant="outline" className="w-full h-10 sm:h-11 text-sm sm:text-base" onClick={handleGoogleSignInClick} disabled={isLoading}>
                      <svg className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      구글로 로그인
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4">
                    <div className="space-y-2">
                      <Input type="text" placeholder="회사명" value={companyName} onChange={e => setCompanyName(e.target.value)} disabled={isLoading} className="h-10 sm:h-11 text-sm sm:text-base" />
                    </div>
                    <div className="space-y-2">
                      <Input type="text" placeholder="대표 제품명" value={mainProduct} onChange={e => setMainProduct(e.target.value)} disabled={isLoading} className="h-10 sm:h-11 text-sm sm:text-base" />
                    </div>
                    <div className="space-y-2">
                      <Input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} className="h-10 sm:h-11 text-sm sm:text-base" />
                    </div>
                    <div className="space-y-2">
                      <Input type="password" placeholder="비밀번호 (최소 6자)" value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} className="h-10 sm:h-11 text-sm sm:text-base" />
                    </div>
                    <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base" disabled={isLoading}>
                      {isLoading ? "가입 중..." : "회원가입"}
                    </Button>

                    <div className="relative my-4 sm:my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs sm:text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">또는</span>
                      </div>
                    </div>

                    <Button type="button" variant="outline" className="w-full h-10 sm:h-11 text-sm sm:text-base" onClick={handleGoogleSignInClick} disabled={isLoading}>
                      <svg className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      구글로 가입하기
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Google Onboarding Dialog */}
      <Dialog open={showGoogleOnboarding} onOpenChange={setShowGoogleOnboarding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>구글로 시작하기</DialogTitle>
            <DialogDescription>
              서비스 이용을 위해 회사명과 대표제품명을 입력해주세요
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input type="text" placeholder="회사명" value={companyName} onChange={e => setCompanyName(e.target.value)} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Input type="text" placeholder="대표 제품명" value={mainProduct} onChange={e => setMainProduct(e.target.value)} disabled={isLoading} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoogleOnboarding(false)} disabled={isLoading}>
              취소
            </Button>
            <Button onClick={handleGoogleOnboardingSubmit} disabled={isLoading}>
              {isLoading ? "처리 중..." : "구글로 계속하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};
export default Auth;