import axiosInstance from "../axiosInstance";

export type ActiveEndpointResponse = {
  data: {
    computer_name: string;
    ngrok_url: string; // may already include /trigger
    updated_at: string;
  };
};

export async function fetchActiveNgrokUrl(
  computerName?: string
): Promise<string> {
  const resp = await axiosInstance.get<ActiveEndpointResponse>(
    "/server-endpoints/active",
    { params: computerName ? { computer_name: computerName } : undefined }
  );
  return resp.data.data.ngrok_url;
}
