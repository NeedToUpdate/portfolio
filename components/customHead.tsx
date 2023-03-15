import Head from "next/head";
import React from "react";

export default function CustomHead() {
  return (
    <Head>
      <title>Art Nikitin</title>
      <meta name="title" content="Art Nikitin" />
      <meta name="description" content="A self-starter self-taught full-stack dev. " />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="keywords" content="tech, javascript, portfolio, python" />
      <meta name="robots" content="index, follow" />
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
      <meta name="author" content="Art Nikitin" />

      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://artemnikitin.dev/" />
      <meta property="og:title" content="Artem Nikitin" />
      <meta property="og:description" content="A self-starter self-taught full-stack dev. " />
      <meta property="og:image" content="/images/index.jpg" />

      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content="https://artemnikitin.dev/" />
      <meta property="twitter:title" content="Artem Nikitin" />
      <meta property="twitter:description" content="A self-starter self-taught full-stack dev. " />
      <meta property="twitter:image" content="/images/index.jpg" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
  );
}
