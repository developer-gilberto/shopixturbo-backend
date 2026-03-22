type VerificationEmailTemplateProps = {
  verificationUrl: string;
  appName: string;
  tokenExpirationInText: string;
};

export function getVerificationEmailTemplate({
  verificationUrl,
  appName,
  tokenExpirationInText,
}: VerificationEmailTemplateProps): string {
  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <style>
        @media only screen and (max-width: 600px) {
          .container {
            width: 100% !important;
            border-radius: 0 !important;
          }

          .content {
            padding: 20px !important;
          }

          .button {
            width: 100% !important;
            display: block !important;
          }

          .logo img {
            max-width: 160px !important;
          }
        }
      </style>
    </head>

    <body style="margin:0; padding:0; background-color:#0f0f0f; font-family:Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding: 20px;">
        <tr>
          <td align="center">

            <table
              class="container"
              width="600"
              cellpadding="0"
              cellspacing="0"
              style="max-width:600px; width:100%; background:#1a1a1a; border-radius:12px; overflow:hidden;"
            >

              <!-- Logo -->
              <tr>
                <td align="center" class="logo" style="padding: 30px 20px;">
                  <img src="cid:logo" alt="${appName}" style="max-width:220px; width:100%; height:auto;" />
                </td>
              </tr>

              <!-- Conteúdo -->
              <tr>
                <td class="content" style="padding: 30px; color:#ffffff; text-align:center;">

                  <h1 style="color:#ff7a00; font-size:24px; margin-bottom:10px;">
                    Ative sua conta 🚀
                  </h1>

                  <p style="color:#cccccc; font-size:16px;">
                    Clique no botão abaixo para ativar sua conta no <strong>${appName}</strong>.
                  </p>

                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top:20px;">
                    <tr>
                      <td align="center">
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td align="center" bgcolor="#ff3c00" style="border-radius:8px;">
                              <a
                                href="${verificationUrl}"
                                target="_blank"
                                style="
                                  display:block;
                                  width:100%;
                                  padding:14px 0;
                                  font-family:Arial, sans-serif;
                                  font-size:16px;
                                  color:#ffffff;
                                  text-decoration:none;
                                  font-weight:bold;
                                  border-radius:8px;
                                  background:#ff3c00;
                                "
                              >
                                Ativar Conta
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <p style="margin-top:20px; font-size:14px; color:#aaaaaa;">
                    Ou copie o link abaixo:
                  </p>

                  <p style="font-size:13px; color:#ffb366; word-break:break-all;">
                    ${verificationUrl}
                  </p>

                  <p style="margin-top:15px; font-size:12px; color:#888;">
                    Este link expira em ${tokenExpirationInText}.
                  </p>

                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}
