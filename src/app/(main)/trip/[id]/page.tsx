interface TripPageProps {
  params: Promise<{ id: string }>;
}

export default async function TripPage({ params }: TripPageProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold">Trip Itinerary</h1>
      <p className="text-muted-foreground mt-2">Trip ID: {id}</p>
    </div>
  );
}
