export const CMD = "npm install @argusdev/sdk-browser";

export const ERR_POOL = [
  { level: "ERROR", color: "#F04438", msg: "TypeError: Cannot read properties of undefined (reading 'map')", route: "/dashboard" },
  { level: "FATAL", color: "#C22A31", msg: "RangeError: Maximum call stack size exceeded", route: "/checkout" },
  { level: "WARN", color: "#F59E0B", msg: 'Warning: Each child in a list should have a unique "key" prop', route: "/products" },
  { level: "ERROR", color: "#F04438", msg: "NetworkError: Failed to fetch /api/v1/projects", route: "/settings" },
  { level: "ERROR", color: "#F04438", msg: "TypeError: user.profile is null", route: "/profile" },
  { level: "INFO", color: "#4C8DFF", msg: "Slow resource: /assets/vendor.js took 4.2s", route: "/" },
  { level: "ERROR", color: "#F04438", msg: "ReferenceError: analytics is not defined", route: "/cart" },
];

export const clock = (k: number) => {
  const s = (14 + k * 7) % 60;
  return `14:0${3 + (k % 6)}:${s < 10 ? `0${s}` : s}`;
};
