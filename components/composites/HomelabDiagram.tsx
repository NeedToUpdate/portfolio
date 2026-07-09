"use client";

import { useState } from "react";
import Text from "@/components/ui/Text";
import { routeNodeClass } from "@/lib/routeDiagram";
import InteractiveFigure from "./InteractiveFigure";

interface DiagramNode {
  id: string;
  label: string;
  explanation: string;
}

const INGRESS: DiagramNode[] = [
  {
    id: "client",
    label: "Client",
    explanation:
      "Your laptop or phone. It trusts the homelab's internal CA, so every *.home domain gets valid HTTPS even though no public authority signed the certificate.",
  },
  {
    id: "tailscale",
    label: "Tailscale (WireGuard)",
    explanation:
      "A mesh VPN with no public listener. The client authenticates onto the mesh before it can reach anything inside the cluster. That handshake is the only front door.",
  },
  {
    id: "mesh",
    label: "DNSMasq + Traefik ×3",
    explanation:
      "Three nodes each run DNSMasq to resolve .home domains and Traefik to terminate TLS and route by hostname. Any one of the three can go down without taking ingress with it.",
  },
  {
    id: "authentik",
    label: "Authentik (SSO)",
    explanation:
      "Every request passes a forward-auth check here before it reaches an app. One login, OIDC or LDAP depending on what the app speaks, gates all eighteen-plus internal apps.",
  },
  {
    id: "app",
    label: "App",
    explanation:
      "Jellyfin, Immich, Grafana, whatever the hostname pointed to. It never sees a request that hasn't already cleared identity.",
  },
];

const DEPLOY: DiagramNode[] = [
  {
    id: "agent",
    label: "Claude Code / Codex",
    explanation:
      "An agent drafts the Kubernetes manifests for whatever I'm adding, the same way I'd ask a teammate to put up a first draft.",
  },
  {
    id: "pr",
    label: "Pull Request",
    explanation:
      "Nothing merges without me reading the diff. This is the only gate between an agent's draft and a running cluster.",
  },
  {
    id: "github",
    label: "GitHub",
    explanation: "Holds the desired state of the cluster. ArgoCD watches this repo, not my terminal.",
  },
  {
    id: "argocd",
    label: "ArgoCD",
    explanation:
      "Polls GitHub for changes and reconciles the live cluster to match. If something gets changed by hand, including by me, ArgoCD quietly reverts it back to what's in Git.",
  },
  {
    id: "cluster",
    label: "Cluster nodes",
    explanation:
      "Two old laptops and an old server run the HA control plane and share ingress duty. Two mini PCs sit underneath as a worker pool.",
  },
];

function NodeRow({
  title,
  nodes,
  activeId,
  onSelect,
}: {
  title: string;
  nodes: DiagramNode[];
  activeId: string;
  onSelect: (node: DiagramNode) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-[0.18em] text-muted">{title}</p>
      <div className="flex flex-wrap items-center gap-2">
        {nodes.map((node, i) => (
          <span key={node.id} className="flex items-center gap-2">
            {i > 0 && (
              <span aria-hidden className="text-muted/50">
                →
              </span>
            )}
            <button
              type="button"
              data-testid={`node-${node.id}`}
              aria-pressed={activeId === node.id}
              onClick={() => onSelect(node)}
              className={`appearance-none bg-transparent cursor-pointer ${routeNodeClass(
                activeId === node.id
              )}`}
            >
              {node.label}
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Click any node in either path to see what it does. */
export default function HomelabDiagram() {
  const [active, setActive] = useState<DiagramNode>(INGRESS[1]);

  return (
    <InteractiveFigure caption="Click a node in either path. Ingress on top: how a request reaches an app. Deployment on the bottom: how a change reaches the cluster.">
      <div className="flex flex-col gap-6">
        <NodeRow title="Ingress" nodes={INGRESS} activeId={active.id} onSelect={setActive} />
        <NodeRow title="Deployment" nodes={DEPLOY} activeId={active.id} onSelect={setActive} />
        <Text variant="small" data-testid="node-explanation" as="p">
          <strong className="text-ink">{active.label}.</strong> {active.explanation}
        </Text>
      </div>
    </InteractiveFigure>
  );
}
