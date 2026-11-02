import { describe, it, expect } from "vitest";
import { limpiarNombre, conMayuscula, nombreNuevo, nombreRepetido, separarNombres, avisoDeRepetidos, enLista, enUnaLinea, LARGO_MAXIMO, nombreParecido, avisoDeParecidos } from "./nombres";

describe("limpiarNombre", () => {
  it("quita espacios de sobra", () => {
    expect(limpiarNombre("  Javier   López ")).toBe("Javier López");
  });

  it("vacío o solo espacios, null", () => {
    expect(limpiarNombre("")).toBeNull();
    expect(limpiarNombre("    ")).toBeNull();
    expect(limpiarNombre(undefined)).toBeNull();
  });

  it("corta los que no caben", () => {
    expect(limpiarNombre("a".repeat(60))).toHaveLength(LARGO_MAXIMO);
  });

  it("al cortar no deja un espacio al final", () => {
    const nombre = "a".repeat(LARGO_MAXIMO - 1) + " b";
    expect(limpiarNombre(nombre)).toBe("a".repeat(LARGO_MAXIMO - 1));
  });
});

describe("conMayuscula", () => {
  it("la inicial de cada palabra", () => {
    expect(conMayuscula("javier lópez")).toBe("Javier López");
  });

  it("con tildes y eñes", () => {
    expect(conMayuscula("ángel ñúñez")).toBe("Ángel Ñúñez");
  });

  it("de, del, la... se quedan en minúscula", () => {
    expect(conMayuscula("luis de la fuente")).toBe("Luis de la Fuente");
    expect(conMayuscula("ana del río y gil")).toBe("Ana del Río y Gil");
  });

  it("aunque el nombre empiece por una de esas", () => {
    expect(conMayuscula("la mari")).toBe("La Mari");
  });

  it("los compuestos con guion, las dos", () => {
    expect(conMayuscula("ana-maría")).toBe("Ana-María");
  });

  it("si ya lleva alguna mayúscula, no lo toca", () => {
    expect(conMayuscula("McGregor")).toBe("McGregor");
    expect(conMayuscula("JJ")).toBe("JJ");
    expect(conMayuscula("luis B")).toBe("luis B");
  });

  it("los números, tal cual", () => {
    expect(conMayuscula("luis 2")).toBe("Luis 2");
  });
});

describe("nombreNuevo", () => {
  it("el nombre limpio si ha cambiado", () => {
    expect(nombreNuevo(" Javier ", "Jvier")).toBe("Javier");
  });

  it("si es el mismo, nada que guardar", () => {
    expect(nombreNuevo("Javier  ", "Javier")).toBeNull();
  });

  it("cambiar solo mayúsculas sí cuenta", () => {
    expect(nombreNuevo("javier", "Javier")).toBe("javier");
  });

  it("no se deja a nadie sin nombre", () => {
    expect(nombreNuevo("   ", "Javier")).toBeNull();
  });
});

describe("nombreRepetido", () => {
  const viajeros = [{ id: "a", nombre: "Ana" }, { id: "l", nombre: "Luis" }];

  it("pilla el mismo nombre y dice cuál", () => {
    expect(nombreRepetido("Luis", viajeros)).toBe("Luis");
  });

  it("aunque cambien mayúsculas o tildes", () => {
    expect(nombreRepetido("luis", viajeros)).toBe("Luis");
    expect(nombreRepetido("Luís", viajeros)).toBe("Luis");
    expect(nombreRepetido("ANA", viajeros)).toBe("Ana");
  });

  it("con la inicial del apellido ya es otro", () => {
    expect(nombreRepetido("Luis G.", viajeros)).toBe(null);
  });

  it("al renombrar, el propio no cuenta", () => {
    expect(nombreRepetido("Luis", viajeros, "l")).toBe(null);
    expect(nombreRepetido("Ana", viajeros, "l")).toBe("Ana");
  });

  it("sin viajeros no hay repetidos", () => {
    expect(nombreRepetido("Luis", [])).toBe(null);
  });
});

describe("separarNombres", () => {
  const viajeros = [{ id: "a", nombre: "Ana" }];

  it("uno solo, como siempre", () => {
    expect(separarNombres("Luis", viajeros)).toEqual({ nuevos: ["Luis"], repetidos: [] });
  });

  it("varios separados por comas, limpios", () => {
    expect(separarNombres(" Luis ,Marta,  Javier  López", viajeros).nuevos).toEqual([
      "Luis",
      "Marta",
      "Javier López",
    ]);
  });

  it("con y o e al final, como se dice", () => {
    expect(separarNombres("Luis, Marta y Javier", viajeros).nuevos).toEqual(["Luis", "Marta", "Javier"]);
    expect(separarNombres("luis e inés", viajeros).nuevos).toEqual(["Luis", "Inés"]);
    expect(separarNombres("Luis Y Marta", viajeros).nuevos).toEqual(["Luis", "Marta"]);
  });

  it("la y dentro de un nombre no corta nada", () => {
    expect(separarNombres("Yolanda, Eyre", viajeros).nuevos).toEqual(["Yolanda", "Eyre"]);
  });

  it("también con punto y coma", () => {
    expect(separarNombres("Luis; Marta", viajeros).nuevos).toEqual(["Luis", "Marta"]);
  });

  it("se salta las comas sueltas", () => {
    expect(separarNombres("Luis,, ,Marta,", viajeros).nuevos).toEqual(["Luis", "Marta"]);
  });

  it("aparta los que ya están en el viaje", () => {
    expect(separarNombres("Luis, ana", viajeros)).toEqual({
      nuevos: ["Luis"],
      repetidos: [{ nombre: "Ana", yaEsta: "Ana" }],
    });
  });

  it("y los que van dos veces en lo escrito", () => {
    expect(separarNombres("Luis, Marta, Luís", viajeros)).toEqual({
      nuevos: ["Luis", "Marta"],
      repetidos: [{ nombre: "Luís", yaEsta: "Luis" }],
    });
  });

  it("les pone la mayúscula que no les pusiste", () => {
    expect(separarNombres("luis, marta garcía", viajeros).nuevos).toEqual(["Luis", "Marta García"]);
  });

  it("vacío, nada", () => {
    expect(separarNombres("  ,  ", viajeros)).toEqual({ nuevos: [], repetidos: [] });
  });
});

describe("avisoDeRepetidos", () => {
  it("uno", () => {
    expect(avisoDeRepetidos(["Luis"])).toMatch(/^Luis ya está en el viaje\./);
  });

  it("varios, con su y", () => {
    expect(avisoDeRepetidos(["Luis", "Ana", "Pedro"])).toMatch(/^Luis, Ana y Pedro ya están en el viaje\./);
  });

  it("si uno sale dos veces, se nombra una", () => {
    expect(avisoDeRepetidos(["Luis", "Luis"])).toMatch(/^Luis ya está/);
  });

  it("sin nadie, nada", () => {
    expect(avisoDeRepetidos([])).toBeNull();
  });
});

describe("enLista", () => {
  it("comas y una y al final", () => {
    expect(enLista(["Ana", "Luis", "Marta"])).toBe("Ana, Luis y Marta");
    expect(enLista(["Ana", "Luis"])).toBe("Ana y Luis");
  });

  it("uno solo o ninguno, sin y", () => {
    expect(enLista(["Ana"])).toBe("Ana");
    expect(enLista([])).toBe("");
  });

  it("e delante de sonido i", () => {
    expect(enLista(["Luis", "Inés"])).toBe("Luis e Inés");
    expect(enLista(["Ana", "Íñigo"])).toBe("Ana e Íñigo");
    expect(enLista(["Ana", "Hilario"])).toBe("Ana e Hilario");
    expect(enLista(["Ana", "irene"])).toBe("Ana e irene");
  });

  it("y cuando la hi suena ye", () => {
    expect(enLista(["Ana", "Hierro"])).toBe("Ana y Hierro");
    expect(enLista(["Ana", "Iolanda"])).toBe("Ana y Iolanda");
  });

  it("no se lía con las monedas", () => {
    expect(enLista(["EUR", "MAD", "USD"])).toBe("EUR, MAD y USD");
    expect(enLista(["EUR", "INR"])).toBe("EUR e INR");
  });
});

describe("enUnaLinea", () => {
  it("un nombre por línea pasa a ir con comas", () => {
    expect(enUnaLinea("Ana\nLuis\r\nMarta")).toBe("Ana, Luis, Marta");
  });

  it("quita los guiones y números de las listas", () => {
    expect(enUnaLinea("- Ana\n• Luis\n3. Marta\n4) Eva")).toBe("Ana, Luis, Marta, Eva");
  });

  it("se salta las líneas vacías", () => {
    expect(enUnaLinea("Ana\n\n  \nLuis\n")).toBe("Ana, Luis");
  });
});

describe("nombreParecido", () => {
  const viajeros = [{ nombre: "Ana" }, { nombre: "Luis" }, { nombre: "María José" }];

  it("el mismo nombre con la inicial o el apellido", () => {
    expect(nombreParecido("Ana M.", viajeros)).toBe("Ana");
    expect(nombreParecido("Ana García", viajeros)).toBe("Ana");
    expect(nombreParecido("María", viajeros)).toBe("María José");
  });

  it("una letra cambiada, de más o de menos", () => {
    expect(nombreParecido("Lusi", viajeros)).toBe("Luis");
    expect(nombreParecido("Luiss", viajeros)).toBe("Luis");
    expect(nombreParecido("Lis", viajeros)).toBeNull();
  });

  it("sin mirar tildes, mayúsculas ni puntos", () => {
    expect(nombreParecido("luís", [{ nombre: "Luiz" }])).toBe("Luiz");
    expect(nombreParecido("ANA m", viajeros)).toBe("Ana");
  });

  it("los nombres cortos con una letra distinta son otra persona", () => {
    expect(nombreParecido("Ane", viajeros)).toBeNull();
  });

  it("dos letras distintas ya no se parecen", () => {
    expect(nombreParecido("Lola", [{ nombre: "Lula" }, { nombre: "Pepe" }])).toBe("Lula");
    expect(nombreParecido("Pablo", [{ nombre: "Paula" }])).toBeNull();
  });

  it("Mario y María son dos personas", () => {
    expect(nombreParecido("Mario", [{ nombre: "María" }])).toBeNull();
    expect(nombreParecido("Julia", [{ nombre: "Julio" }])).toBeNull();
  });

  it("igual del todo no es parecido: eso ya lo para el de repetidos", () => {
    expect(nombreParecido("ana", viajeros)).toBeNull();
  });

  it("sin nadie parecido, nada", () => {
    expect(nombreParecido("Marta", viajeros)).toBeNull();
    expect(nombreParecido("Pedro", [])).toBeNull();
  });
});

describe("avisoDeParecidos", () => {
  it("uno", () => {
    expect(avisoDeParecidos([{ nombre: "Ana M.", conQuien: "Ana" }])).toBe(
      "¿Ana M. es otra persona? Se parece a Ana, que ya está en el viaje."
    );
  });

  it("varios", () => {
    expect(
      avisoDeParecidos([
        { nombre: "Ana M.", conQuien: "Ana" },
        { nombre: "Lusi", conQuien: "Luis" },
      ])
    ).toBe("¿Ana M. y Lusi son otras personas? Se parecen a Ana y Luis.");
  });

  it("ninguno, nada", () => {
    expect(avisoDeParecidos([])).toBeNull();
  });
});
