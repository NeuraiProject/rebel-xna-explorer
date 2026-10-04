import { paths } from "../lib/route";
import { Card, EmptyState, useDocumentTitle } from "../components/ui";

export function NotFoundPage() {
  useDocumentTitle("Page not found");
  return (
    <Card>
      <EmptyState title="This page does not exist">
        The explorer has <a href={paths.home()}>the latest blocks</a>, <a href={paths.assets()}>the assets</a> and{" "}
        <a href={paths.mempool()}>the mempool</a>. To find a block, transaction, address or asset, use the search box above.
      </EmptyState>
    </Card>
  );
}
