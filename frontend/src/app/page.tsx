import { cookies } from "next/headers";
import { HomeClient } from "./HomeClient";

export default async function Page() {
  const cookieStore = await cookies();
  const introCompleted = cookieStore.get("intro_completed")?.value === "true";

  return <HomeClient initialIntroCompleted={introCompleted} />;
}
