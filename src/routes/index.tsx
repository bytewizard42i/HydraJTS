import { Title } from "@solidjs/meta";
import { HydraProtocol } from "~/components/HydraProtocol";

export default function Home() {
  return (
    <main>
      <Title>HydraJTS - Multi-Instance Parallel ZK-Proof Execution</Title>
      <HydraProtocol />
    </main>
  );
}
