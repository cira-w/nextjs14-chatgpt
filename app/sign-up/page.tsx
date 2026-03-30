"use client";
import { Loading } from "@/components/auth/loading";
import { api } from "@/convex/_generated/api";
import { useConvexAuth, useMutation } from "convex/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
const Signup = () => {
  const isAuthenticated = useConvexAuth();
  const storeUser = useMutation(api.users.store);
  const router = useRouter();
  useEffect(() => {
    const storeUserData = async () => {
      if (isAuthenticated) {
        try {
          await storeUser();
          router.push("/");
        } catch (error) {
          console.error("Error storing user data:", error);
        }
      }
    };
    storeUserData();
  }, [isAuthenticated, storeUser, router]);
  return <Loading />;
};

export default Signup;
