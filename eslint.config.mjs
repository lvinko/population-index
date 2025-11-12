import nextConfig from "eslint-config-next";

const config = [
  ...nextConfig,
  {
    ignores: ["node_modules", ".next", "out", "build"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default config;

