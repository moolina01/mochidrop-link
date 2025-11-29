import { supabase } from "@/utils/supabase";

export default async function  Page() {
  const supabases = supabase;

  const { data, error } = await supabase
    .from("envios")
    .select("*")
    .eq("id", "1231231231232")
    .limit(10);

  if (error) {
    console.error(error);
    return <div>Error cargando datos</div>;
  }

  return (
    <div>
      <h1>Lista de envíos</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
