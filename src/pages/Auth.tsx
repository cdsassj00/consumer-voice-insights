import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Session } from "@supabase/supabase-js";
import { FlowBackground } from "@/components/FlowBackground";
import { MessageCircle, TrendingUp, Users } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) {
          navigate("/");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "입력 오류",
        description: "이메일과 비밀번호를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "비밀번호 오류",
        description: "비밀번호는 최소 6자 이상이어야 합니다.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "회원가입 실패",
            description: "이미 가입된 이메일입니다. 로그인해주세요.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "회원가입 실패",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "회원가입 완료",
          description: "로그인되었습니다.",
        });
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        title: "오류 발생",
        description: "회원가입 중 오류가 발생했습니다.",
        variant: "destructive",
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
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "로그인 실패",
            description: "이메일 또는 비밀번호가 올바르지 않습니다.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "로그인 실패",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "로그인 성공",
          description: "환영합니다!",
        });
      }
    } catch (error) {
      console.error("Signin error:", error);
      toast({
        title: "오류 발생",
        description: "로그인 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <FlowBackground />
      
      {/* Softer overlay so background animation is clearly visible */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/60 to-background/80 backdrop-blur-sm pointer-events-none" />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
          {/* Left side - Marketing content */}
          <div className="space-y-8 text-center md:text-left">
            <div className="space-y-4 animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent leading-tight">
                소비자 VOC의
                <br />새로운 패러다임
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
                이제 더 이상 그럴듯한 이야기가 아닌,
                <br />
                <span className="text-foreground font-semibold">진짜 소비자의 목소리</span>를 수집하세요
              </p>
            </div>

            <div className="space-y-6 mt-12">
              <div className="flex items-start gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">실제 커뮤니티에서 수집</h3>
                  <p className="text-muted-foreground">
                    공식 리뷰 사이트가 아닌, 소비자들이 진솔하게 의견을 나누는 커뮤니티 게시판에서 직접 수집합니다
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">AI 기반 심층 분석</h3>
                  <p className="text-muted-foreground">
                    단순 키워드 통계를 넘어, 소비자 페르소나와 경쟁 포지셔닝까지 분석합니다
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">진짜 인사이트 발견</h3>
                  <p className="text-muted-foreground">
                    꾸며진 후기가 아닌, 소비자들의 진실된 경험과 니즈를 파악하세요
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Auth card */}
          <Card className="w-full backdrop-blur-lg bg-card/95 shadow-2xl border-border/50 animate-scale-in">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">소비자 인사이트 플랫폼</CardTitle>
              <CardDescription>
                실제 소비자들의 의견을 분석하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">로그인</TabsTrigger>
                  <TabsTrigger value="signup">회원가입</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Input
                        type="email"
                        placeholder="이메일"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Input
                        type="password"
                        placeholder="비밀번호"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "로그인 중..." : "로그인"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Input
                        type="email"
                        placeholder="이메일"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Input
                        type="password"
                        placeholder="비밀번호 (최소 6자)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "가입 중..." : "회원가입"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
