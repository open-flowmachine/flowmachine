import { listCredentials } from "@/action/credential/list-credentials";
import CredentialsTablePage from "@/presentation/feature/credentials-table/credentials-table-page";

export default async function Page() {
  const initialData = await listCredentials();
  return <CredentialsTablePage initialData={initialData} />;
}
