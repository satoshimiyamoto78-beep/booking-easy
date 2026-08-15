import { redirect } from "next/navigation";

// Temporary bridge: the real Booking Easy marketing/signup homepage lands
// in a follow-up stage. Until then, root traffic goes to the platform's
// first tenant instead of 404ing.
export default function RootPage() {
  redirect("/the-studio");
}
