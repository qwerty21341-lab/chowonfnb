import { getDictionary } from "@/dictionaries";
import { DansoPage } from "./danso-client";

export default async function DansoRoute() {
  const dict = await getDictionary("ko");
  return <DansoPage dict={dict} />;
}
