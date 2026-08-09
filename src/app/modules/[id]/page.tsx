import ModuleClientContent from "./module-client";

export function generateStaticParams() {
  return [
    {id: "identity"},
    {id: "privacy"},
    {id: "security"},
    {id: "data-broker"},
    {id: "social-media"},
  ];
}

export default function ModulePage({params}: {params: {id: string}}) {
  return <ModuleClientContent id={params.id} />;
}
