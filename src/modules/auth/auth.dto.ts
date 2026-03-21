export interface SignUpDTO {
  name: string;
  email: string;
  password: string;
}

export interface SignInDTO extends Pick<SignUpDTO, 'email' | 'password'> {}
