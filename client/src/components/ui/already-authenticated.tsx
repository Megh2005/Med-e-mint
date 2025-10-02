"use client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./button";
import { useRouter } from "next/navigation";

const AlreadyAuthenticated = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push("/auth");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-sm p-8 space-y-4 bg-background rounded-lg shadow-neumorphic-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold">You are already authenticated</h2>
          {user?.email && <p className="mt-2 text-gray-600">{user.email}</p>}
        </div>
        <Button onClick={handleLogout} className="w-full shadow-neumorphic active:shadow-neumorphic-inset">
          Logout
        </Button>
      </div>
    </div>
  );
};

export default AlreadyAuthenticated;