export async function saveToPhotoLibrary(uri: string): Promise<"saved" | "denied"> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error("Couldn't download the image.");
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = "aura-headshot.jpg";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
  return "saved";
}
