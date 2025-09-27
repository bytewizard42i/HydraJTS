import { Title } from "@solidjs/meta";
import SimpleHydraProtocol from "~/components/SimpleHydraProtocol";

export default function Home() {
  return (
    <main>
      <Title>HydraJTS - Multi-Instance Parallel ZK-Proof Execution</Title>
      <SimpleHydraProtocol />
    </main>
  );
}
