export interface IAuthResponse {
  data: {
    id: string;
    email: string;
    userType: string;
    accessToken: string;
    displayPicture: string;
  };
}

export type CountdownCallback = (minutes: number, seconds: number) => void;
export type CountdownEndCallback = () => void;

export type userType = "USER" | "BUSINESS_USER";

export type AuthHeaderType = {
  loading: boolean;
  message: string;
  linkText?: string;
  onClick?: () => void;
};
