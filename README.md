# DIRECT UPLOAD TO S3

## Primeiros passa na AWS
- Crie o Bucket no S3

- Configure o CORS dele

![alt text](https://s3.amazonaws.com/heroku-devcenter-files/article-images/1507825624-Screen-Shot-2017-10-11-at-9.50.50-AM.png)

```shell

<CORSConfiguration>
   <CORSRule>
        <AllowedOrigin>*</AllowedOrigin>
        <AllowedMethod>GET</AllowedMethod>
        <AllowedMethod>POST</AllowedMethod>
        <AllowedMethod>PUT</AllowedMethod>
        <AllowedHeader>*</AllowedHeader>
    </CORSRule>
</CORSConfiguration>

```

- Crie suas chaves de autenticação para AWS
