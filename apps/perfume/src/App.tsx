import { useEffect, useState } from "react";
import { Toasts } from "./components/ui";
import { useStore } from "./lib/store";
import { match, useRoute } from "./lib/router";
import { ShopLayout } from "./shop/ShopLayout";
import { Welcome } from "./shop/Welcome";
import { Home } from "./shop/Home";
import { Catalogue } from "./shop/Catalogue";
import { ProductPage } from "./shop/ProductPage";
import { Bag, Checkout } from "./shop/Bag";
import { Account, OrderView, Wishlist } from "./shop/Account";
import { StudioLayout } from "./studio/StudioLayout";
import { Dashboard } from "./studio/Dashboard";
import { Inventory } from "./studio/Inventory";
import { ProductEditor, Products } from "./studio/Products";
import { NewOrder, OrderDetail, Orders } from "./studio/Orders";
import { Categories } from "./studio/Categories";
import { Settings } from "./studio/Settings";

function useTheme() {
  const { db } = useStore();
  const { theme, accent, brandName } = db.settings;
  const [sysDark, setSysDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => setSysDark(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  useEffect(() => {
    const dark = theme === "dark" || (theme === "system" && sysDark);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.setProperty("--accent", accent);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0d0c0b" : "#111111");
  }, [theme, accent, sysDark]);
  useEffect(() => {
    document.title = `${brandName} — Perfume Studio`;
  }, [brandName]);
}

export default function App() {
  const { db } = useStore();
  const { path, query } = useRoute();
  useTheme();

  let page: React.ReactNode;
  let m: Record<string, string> | null;

  if (path.startsWith("/studio")) {
    if (path === "/studio") page = <Dashboard />;
    else if (path === "/studio/inventory") page = <Inventory key={query.toString()} query={query} />;
    else if (path === "/studio/products") page = <Products />;
    else if ((m = match("/studio/products/:id", path))) page = <ProductEditor key={m.id} id={m.id} />;
    else if (path === "/studio/orders") page = <Orders />;
    else if (path === "/studio/orders/new") page = <NewOrder />;
    else if ((m = match("/studio/orders/:id", path))) page = <OrderDetail id={m.id} />;
    else if (path === "/studio/categories") page = <Categories />;
    else if (path === "/studio/settings") page = <Settings />;
    else page = <Dashboard />;
    return (
      <>
        <StudioLayout path={path}>{page}</StudioLayout>
        <Toasts />
      </>
    );
  }

  if (path === "/welcome" || (path === "/" && !db.settings.onboarded)) {
    return (
      <>
        <Welcome />
        <Toasts />
      </>
    );
  }

  let hideNav = false;
  if (path === "/") page = <Home />;
  else if (path === "/shop") page = <Catalogue key={query.toString()} query={query} />;
  else if ((m = match("/p/:id", path))) {
    page = <ProductPage key={m.id} id={m.id} />;
    hideNav = true;
  } else if (path === "/bag") page = <Bag />;
  else if (path === "/checkout") {
    page = <Checkout />;
    hideNav = true;
  } else if (path === "/wishlist") page = <Wishlist />;
  else if (path === "/account") page = <Account />;
  else if ((m = match("/order/:id", path))) page = <OrderView id={m.id} isNew={query.get("new") === "1"} />;
  else page = <Home />;

  return (
    <>
      <ShopLayout path={path} hideNav={hideNav}>
        {page}
      </ShopLayout>
      <Toasts />
    </>
  );
}
