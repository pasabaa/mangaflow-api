# Documentación de la API de MangaFlow

Bienvenido a la documentación oficial de la API de MangaFlow. Esta API te permite acceder a información sobre mangas, detalles de mangas, capítulos y realizar búsquedas de mangas por palabras clave.

## Base URL

La base URL para acceder a la API de MangaFlow es la siguiente:

`https://mangaflow-api.fly.dev/api/` 

## Obtener Mangas

Para obtener mangas, utiliza el método GET con la siguiente ruta:

`/latest` 

Valores permitidos:

- `completed`: Obtiene mangas completados.
- `latest`: Obtiene los últimos mangas.
- `newest`: Obtiene los mangas más nuevos.
- `ongoing`: Obtiene mangas en curso.
- `top`: Obtiene los mangas más populares.

Ejemplo de solicitud:

`https://mangaflow-api.fly.dev/api/latest` 

## Obtener Detalles de un Manga

Para obtener los detalles de un manga, debes incluir el parámetro `id` en la solicitud. El valor del parámetro `id` debe ser el identificador único del manga.

Ejemplo de solicitud:

`https://mangaflow-api.fly.dev/api/detail?id=manga-nl991268` 

## Obtener Detalles de un Capítulo

Para obtener los detalles de un capítulo de manga, debes incluir el parámetro `id` en la solicitud. El valor del parámetro `id` debe ser el identificador único del capítulo del manga.

Ejemplo de solicitud:

`https://mangaflow-api.fly.dev/api/chapter?id=/chapter/manga-qk993867/chapter-40`

## Búsqueda de Mangas

Para realizar una búsqueda de mangas, debes incluir los parámetros `keyword` e `id` en la solicitud. El parámetro `keyword` representa la palabra clave que deseas buscar y el parámetro `page` especifica la página de resultados que deseas obtener.

Ejemplo de solicitud:

`https://mangaflow-api.fly.dev/api/search?keyword=dragon&page=1`

## Headers

La API requiere de una API Key

```js
import axios from "axios";
import React, { useEffect, useState } from "react";

export const useFetchData = (url) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(url, {
          headers: {
            'x-api-key': 'YOUR API KEY HERE' // Tu API key
          }
        });
        setData(response.data);
      } catch (error) {
        setError(error);
        console.log(error)
      }
      setLoading(false);
    };
    fetchData();
  }, [url]);

  return { data, loading, error };
};
```