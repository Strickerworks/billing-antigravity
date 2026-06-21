import Information from "@/app/components/Information";

export default function AddInvoice() {
  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">New Invoice</h1>
        <p className="page-subtitle">Fill in the details below to create a new tax invoice.</p>
      </div>
      <Information />
    </div>
  );
}
