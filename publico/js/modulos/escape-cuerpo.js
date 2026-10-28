/**
 * publico/js/modulos/escape-cuerpo.js
 * Módulo del juego educativo interactivo «Escape del cuerpo humano».
 * Diseñado para 9.º de EGB (Ciencias Naturales): Sistemas Nervioso, Respiratorio y Digestivo.
 */

import { montarPlantilla } from '../nucleo/plantilla.js';
import * as api from '../nucleo/api.js';
import * as ui from '../nucleo/ui.js';
import * as util from '../nucleo/util.js';
import { usuarioActual } from '../nucleo/sesion.js';

await montarPlantilla({ titulo: 'Escape del cuerpo humano' });

const contenedor = document.getElementById('contenido');
const CLAVE_STORAGE = 'escape_cuerpo_progreso_v1';

// --- BANCO DE PREGUNTAS Y CONTENIDOS CURRICULARES (9.º EGB) ---
const DATOS_JUEGO = {
  salas: {
    nervioso: {
      id: 'nervioso',
      nombre: 'Centro de control · Sistema Nervioso',
      icono: '🧠',
      insignia: {
        id: 'experto-coordinacion',
        nombre: 'Experto en coordinación',
        icono: '🧠',
        desc: 'Dominaste las funciones del encéfalo, médula espinal y reflejos.'
      },
      resumen: `
        El <strong>sistema nervioso</strong> es el centro de comando del cuerpo humano. Participa en la recepción de estímulos, procesamiento de información y emisión de respuestas coordinadas.
        <ul>
          <li><strong>El cerebro (encéfalo):</strong> Procesa sensaciones, almacena recuerdos, coordina movimientos voluntarios y elabora pensamientos.</li>
          <li><strong>La médula espinal:</strong> Conduce impulsos nerviosos entre el encéfalo y el resto del cuerpo, y coordina respuestas reflejas inmediatas de protección.</li>
          <li><strong>Los nervios:</strong> Red de fibras que transmiten información sensorial (hacia el encéfalo) y motora (hacia los músculos y órganos).</li>
          <li><strong>Estímulo y respuesta:</strong> Los receptores captan cambios internos o externos y el sistema elabora una respuesta adaptativa.</li>
        </ul>
      `,
      preguntas: [
        {
          id: 'ner_1',
          tipo: 'opcion',
          enunciado: 'Si una persona toca accidentalmente una plancha caliente y retira la mano de inmediato antes de sentir dolor consciente, ¿qué estructura coordinó esta respuesta refleja?',
          opciones: [
            'La médula espinal mediante un arco reflejo inmediato',
            'El estómago a través de contracciones digestivas',
            'Exclusivamente los huesos de la articulación del brazo',
            'Los alvéolos pulmonares durante la inspiración'
          ],
          correcta: 0,
          explicacion: 'La médula espinal coordina los arcos reflejos automáticos para salvaguardar el cuerpo de lesiones graves antes de que la señal viaje y se procese en la corteza cerebral.',
          pista: 'Piensa en la parte del sistema nervioso central que recorre la columna vertebral y emite respuestas automáticas de protección.',
          ejemplo: 'Como cuando el médico golpea suavemente tu rodilla con un martillo y tu pierna se levanta sin pensarlo.'
        },
        {
          id: 'ner_2',
          tipo: 'opcion',
          enunciado: '¿Cuál es la función primordial de los nervios periféricos en la coordinación del organismo?',
          opciones: [
            'Conducir información sensitiva hacia el sistema central y órdenes motoras hacia los músculos',
            'Bombear sangre con nutrientes hacia los órganos vitales',
            'Filtrar las toxinas producidas en la digestión celular',
            'Almacenar el aire oxigenado para situaciones de emergencia'
          ],
          correcta: 0,
          explicacion: 'Los nervios periféricos actúan como cables de comunicación bidireccional: los sensitivos llevan datos al encéfalo y los motores transmiten las órdenes a los efectores.',
          pista: 'Funcionan como el cableado eléctrico que comunica sensores y motores con la computadora central.',
          ejemplo: 'Cuando pisas arena caliente, los nervios de tu pie envían el aviso hacia arriba y traen de vuelta la orden de saltar.'
        },
        {
          id: 'ner_3',
          tipo: 'opcion',
          enunciado: '¿Cuál de las siguientes situaciones describe una respuesta motora VOLUNTARIA coordinada por la corteza cerebral?',
          opciones: [
            'Escribir un resumen en tu cuaderno o patear un balón hacia el arco',
            'El latido constante e involuntario del corazón',
            'La contracción de la pupila cuando te apuntan con una linterna',
            'El movimiento peristáltico del tubo digestivo'
          ],
          correcta: 0,
          explicacion: 'Escribir y patear son acciones voluntarias conscientes planificadas y dirigidas por la corteza cerebral motora, a diferencia de las respuestas vegetativas autónomas.',
          pista: 'Identifica la acción en la que tú decides conscientemente cuándo iniciarla, modificarla o detenerla.',
          ejemplo: 'Tú decides si levantas la mano en clase para participar o si decides tomar un vaso de agua.'
        },
        {
          id: 'ner_4',
          tipo: 'opcion',
          enunciado: 'Al escuchar el silbato en una carrera deportiva, el atleta comienza a correr velozmente. ¿Qué secuencia describe correctamente la ruta biológica de este evento?',
          opciones: [
            'Estímulo auditivo → Receptor sensorial (oído) → Procesamiento en encéfalo → Nervios motores → Músculos',
            'Músculos → Nervios motores → Pulmones → Estímulo sonoro',
            'Receptores sensoriales → Intestino delgado → Sangre → Estímulo auditivo',
            'Encéfalo → Receptores sensoriales → Médula espinal → Estímulo'
          ],
          correcta: 0,
          explicacion: 'El estímulo ambiental es captado por los receptores sensoriales, viaja al encéfalo para su interpretación y de allí parte la orden motora hacia los músculos.',
          pista: 'Comienza con la onda sonora externa, pasa por el sentido que la escucha, llega al cerebro y termina en el movimiento de las piernas.',
          ejemplo: 'Al igual que un semáforo en verde: tus ojos lo ven, tu mente entiende que puedes avanzar y tus pies presionan el acelerador.'
        },
        {
          id: 'ner_5',
          tipo: 'opcion',
          enunciado: 'Durante una prueba de equilibrio sobre una sola pierna, ¿por qué es indispensable la participación del sistema nervioso?',
          opciones: [
            'Porque integra datos de la vista y del oído interno para ordenar microajustes musculares constantes',
            'Porque oxigena de manera directa el tejido cartilaginoso del tobillo',
            'Porque descompone los azúcares que sostienen el fémur',
            'Porque detiene el flujo sanguíneo para evitar vibraciones en la pierna'
          ],
          correcta: 0,
          explicacion: 'El encéfalo (especialmente el cerebelo) compara permanentemente la información visual, vestibular y propioceptiva para regular la tensión de los músculos posturales.',
          pista: 'El cerebro necesita saber cómo está orientado tu cuerpo en el espacio para corregir cualquier inclinación.',
          ejemplo: 'Si cierras los ojos mientras intentas pararte en un solo pie, notarás que mantener el equilibrio se vuelve mucho más difícil.'
        }
      ]
    },

    respiratorio: {
      id: 'respiratorio',
      nombre: 'Misión oxígeno · Sistema Respiratorio',
      icono: '🫁',
      insignia: {
        id: 'explorador-respiratorio',
        nombre: 'Explorador respiratorio',
        icono: '🫁',
        desc: 'Comprendiste el recorrido del aire y el intercambio de gases en los alvéolos.'
      },
      resumen: `
        El <strong>sistema respiratorio</strong> suministra oxígeno a la sangre y elimina el dióxido de carbono producido por el metabolismo celular.
        <ul>
          <li><strong>Vías respiratorias:</strong> Fosas nasales (filtran, templan y humedecen el aire), faringe, laringe, tráquea y bronquios que conducen el aire hacia los pulmones.</li>
          <li><strong>Alvéolos pulmonares:</strong> Millones de diminutos sacos con paredes microscópicas rodeadas de capilares donde ocurre el intercambio de gases (hematosis).</li>
          <li><strong>Intercambio gaseoso:</strong> El oxígeno difunde desde el alvéolo hacia los glóbulos rojos, y el dióxido de carbono viaja desde la sangre hacia el alvéolo para ser exhalado.</li>
          <li><strong>Mecánica ventilatoria:</strong> El diafragma y los músculos intercostales permiten la inhalación y exhalación.</li>
        </ul>
      `,
      preguntas: [
        {
          id: 'resp_1',
          tipo: 'ordenar',
          enunciado: 'Ordena cronológicamente el recorrido del aire inspirado desde el ambiente exterior hasta el sitio donde se oxigena la sangre:',
          elementosCorrectos: [
            '1. Fosas nasales (nariz)',
            '2. Faringe',
            '3. Laringe',
            '4. Tráquea',
            '5. Bronquios',
            '6. Alvéolos pulmonares'
          ],
          explicacion: 'El aire entra por las fosas nasales, atraviesa la faringe y laringe, desciende por la tráquea hacia los bronquios principales y finaliza en los alvéolos pulmonares.',
          pista: 'Inicia en el rostro, baja por la garganta y el conducto anillado del cuello, se bifurca en los pulmones y termina en los saquitos microscópicos.',
          ejemplo: 'Imagina un árbol invertido: el tronco es la tráquea, las ramas gruesas los bronquios y las hojas los alvéolos.'
        },
        {
          id: 'resp_2',
          tipo: 'opcion',
          enunciado: '¿En qué estructuras especializadas del sistema respiratorio se produce fundamentalmente el intercambio de oxígeno y dióxido de carbono entre el aire y la sangre?',
          opciones: [
            'En los alvéolos pulmonares rodeados por capilares sanguíneos',
            'En los cartílagos rígidos de la tráquea',
            'En las cuerdas vocales de la laringe',
            'En el músculo del diafragma'
          ],
          correcta: 0,
          explicacion: 'Los alvéolos pulmonares proporcionan una enorme superficie de intercambio con paredes ultrafinas que permiten la difusión directa de gases hacia y desde la sangre.',
          pista: 'Son pequeñas cavidades en racimo al final de los bronquiolos dentro de los pulmones.',
          ejemplo: 'Tienen un aspecto similar a un racimo de uvas microscópicas cubiertas de diminutas mallas de vasos sanguíneos.'
        },
        {
          id: 'resp_3',
          tipo: 'opcion',
          enunciado: 'Durante la hematosis alveolar, ¿qué dirección siguen los gases por el proceso de difusión?',
          opciones: [
            'El oxígeno entra a la sangre y el dióxido de carbono sale al aire alveolar para ser exhalado',
            'El dióxido de carbono se absorbe hacia la sangre y el oxígeno se expulsa en la espiración',
            'Ambos gases se mezclan con la saliva para alimentar los tejidos corporales',
            'El oxígeno se transforma de inmediato en agua dentro de los bronquios'
          ],
          correcta: 0,
          explicacion: 'Por diferencia de presión parcial, el oxígeno del aire fresco difunde a la sangre desoxigenada, mientras que el CO₂ de desecho pasa al alvéolo para ser liberado al exhalar.',
          pista: 'Recuerda: incorporamos el gas necesario para la vida celular y expulsamos el gas de desecho.',
          ejemplo: 'Al inhalar captas aire rico en O₂; al exhalar sobre un espejo empañas el vidrio con aire caliente cargado de CO₂ y vapor.'
        },
        {
          id: 'resp_4',
          tipo: 'opcion',
          enunciado: '¿Por qué cuando un estudiante hace ejercicio intenso su frecuencia respiratoria se incrementa notablemente?',
          opciones: [
            'Porque las células musculares demandan más oxígeno para generar energía y producen más CO₂ que debe ser eliminado con urgencia',
            'Porque los pulmones necesitan enfriarse acumulando alimentos líquidos',
            'Para evitar que los nervios transmitan impulsos eléctricos al cerebro',
            'Porque la tráquea se cierra temporalmente durante el esfuerzo físico'
          ],
          correcta: 0,
          explicacion: 'Al aumentar la demanda metabólica muscular, se consume más oxígeno en la respiración celular y se genera más dióxido de carbono, estimulando al centro respiratorio.',
          pista: 'Tus músculos están quemando combustible a máxima velocidad y necesitan más oxígeno rápidamente.',
          ejemplo: 'Como el motor de un automóvil a toda velocidad: requiere más aire para combustionar su combustible.'
        },
        {
          id: 'resp_5',
          tipo: 'opcion',
          enunciado: '¿Qué ventaja biológica ofrece respirar por la nariz en lugar de hacerlo directamente por la boca?',
          opciones: [
            'La mucosa nasal y sus vellosidades filtran partículas, calientan y humedecen el aire antes de llegar a los pulmones',
            'Permite digerir directamente los azúcares que flotan en el ambiente',
            'Impide que el oxígeno se mezcle con la sangre del cuerpo',
            'Disminuye la cantidad de oxígeno que llega a los alvéolos'
          ],
          correcta: 0,
          explicacion: 'Las fosas nasales actúan como un sistema de climatización y purificación natural, protegiendo las vías respiratorias inferiores contra polvo y frío.',
          pista: 'Es la primera barrera protectora que acondiciona el aire exterior para que no dañe los delicados alvéolos.',
          ejemplo: 'Si respiras aire helado por la boca te arderá la garganta; la nariz lo calienta a 37 °C antes de que baje.'
        }
      ]
    },

    digestivo: {
      id: 'digestivo',
      nombre: 'La ruta de los alimentos · Sistema Digestivo',
      icono: '🥗',
      insignia: {
        id: 'maestro-digestion',
        nombre: 'Maestro de la digestión',
        icono: '🥗',
        desc: 'Descubriste la transformación de alimentos y absorción de nutrientes.'
      },
      resumen: `
        El <strong>sistema digestivo</strong> descompone mecánicamente y químicamente los alimentos en nutrientes absorbibles por las células.
        <ul>
          <li><strong>Boca:</strong> Masticación y acción de la amilasa salival para formar el bolo alimenticio.</li>
          <li><strong>Esófago:</strong> Tubo muscular que transporta el bolo mediante movimientos peristálticos hacia el estómago.</li>
          <li><strong>Estómago:</strong> Mezcla con jugo gástrico ácido (HCl y pepsina), transformando los alimentos en una masa líquida: el quimo.</li>
          <li><strong>Intestino delgado:</strong> Con ayuda de la bilis (hígado) y jugo pancreático, finaliza la digestión química y sus vellosidades absorben los nutrientes hacia los capilares sanguíneos.</li>
          <li><strong>Intestino grueso:</strong> Reabsorbe agua y sales minerales, compactando los residuos en heces para su expulsión.</li>
        </ul>
      `,
      preguntas: [
        {
          id: 'dig_1',
          tipo: 'ordenar',
          enunciado: 'Ordena la secuencia anatómica correcta del recorrido de los alimentos a lo largo del tubo digestivo:',
          elementosCorrectos: [
            '1. Boca',
            '2. Esófago',
            '3. Estómago',
            '4. Intestino delgado',
            '5. Intestino grueso'
          ],
          explicacion: 'El proceso inicia con la masticación en la boca, transita por el esófago al estómago, prosigue al intestino delgado para absorción y culmina en el intestino grueso.',
          pista: 'Masticas en la boca, pasa al cuello por el esófago, cae al estómago, se absorbe en el intestino delgado y los restos van al grueso.',
          ejemplo: 'Un bocado de manzana es triturado en la boca, traga por el esófago y tarda varias horas en completar la ruta.'
        },
        {
          id: 'dig_2',
          tipo: 'opcion',
          enunciado: '¿En qué órgano del aparato digestivo ocurre la mayor parte de la ABSORCIÓN de nutrientes hacia el torrente sanguíneo?',
          opciones: [
            'En el intestino delgado mediante sus abundantes vellosidades intestinales',
            'En el esófago a través del moco lubricante',
            'En los alvéolos pulmonares durante la inspiración',
            'En las glándulas salivales de la boca'
          ],
          correcta: 0,
          explicacion: 'El intestino delgado posee vellosidades y microvellosidades que multiplican la superficie de contacto para que aminoácidos, glucosa y ácidos grasos pasen a la sangre.',
          pista: 'Es el tramo más largo del tubo digestivo (mide unos 6 metros en un adulto) especializado en nutrir la sangre.',
          ejemplo: 'Como una toalla con miles de pequeños pelitos que absorben hasta la última gota de agua.'
        },
        {
          id: 'dig_3',
          tipo: 'opcion',
          enunciado: '¿Qué transformación clave sufren los alimentos al interactuar con el jugo gástrico dentro del estómago?',
          opciones: [
            'Se mezclan con ácido clorhídrico y enzimas, transformándose en una masa semilíquida ácida llamada quimo',
            'Se oxidan de inmediato para ser expulsados en la respiración',
            'Se transforman en impulsos nerviosos que viajan al cerebro',
            'Se convierten en aire purificado para los pulmones'
          ],
          correcta: 0,
          explicacion: 'El estómago realiza una vigorosa mezcla mecánica y digestión química mediante ácido clorhídrico y pepsina, degradando las proteínas y formando el quimo.',
          pista: 'Es un ambiente muy ácido donde las proteínas complejas comienzan a desarmarse.',
          ejemplo: 'El estómago actúa como una licuadora con ácidos potentes que desintegra los trozos sólidos de comida.'
        },
        {
          id: 'dig_4',
          tipo: 'opcion',
          enunciado: '¿Cuál es la función esencial del intestino grueso o colon en la etapa final de la digestión?',
          opciones: [
            'Reabsorber agua y minerales para evitar la deshidratación y compactar los desechos no digeridos',
            'Producir bilis para disolver las grasas de los alimentos',
            'Distribuir oxígeno directamente a las fibras musculares',
            'Controlar los movimientos reflejos del cuerpo'
          ],
          correcta: 0,
          explicacion: 'El intestino grueso recupera la mayor parte de los líquidos empleados durante la digestión, concentrando los residuos que formarán la materia fecal.',
          pista: 'Evita que el cuerpo pierda agua vital absorbiéndola antes de expulsar los residuos no aprovechados.',
          ejemplo: 'Si el colon no reabsorbiera agua adecuadamente, el cuerpo sufriría una diarrea deshidratante.'
        },
        {
          id: 'dig_5',
          tipo: 'opcion',
          enunciado: 'Una vez que los nutrientes atraviesan las vellosidades del intestino delgado, ¿cómo se distribuyen hacia todas las células del cuerpo?',
          opciones: [
            'Ingresan a los capilares sanguíneos y son transportados por el sistema circulatorio',
            'Flotan por las vías respiratorias hacia los alvéolos',
            'Viajan exclusivamente por el interior de los nervios sensitivos',
            'Son expulsados al exterior a través de la piel'
          ],
          correcta: 0,
          explicacion: 'Los nutrientes absorbidos pasan a la sangre venosa que llega primero al hígado y luego se bombea a través del sistema circulatorio hacia cada célula del organismo.',
          pista: 'La sangre es el vehículo de transporte que lleva los alimentos ya procesados a los billones de células del cuerpo.',
          ejemplo: 'Como una red de camiones de reparto que recogen la mercancía en el centro de distribución (intestino) y la llevan a cada casa (células).'
        }
      ]
    },

    final: {
      id: 'final',
      nombre: 'Desafío final · El código del organismo',
      icono: '🧬',
      insignia: {
        id: 'explorador-cuerpo',
        nombre: 'Explorador del cuerpo humano',
        icono: '🏆',
        desc: 'Completaste la integración funcional de los sistemas del cuerpo humano.'
      },
      resumen: `
        <strong>Misión integradora:</strong> El cuerpo humano no es una colección de partes separadas, sino una unidad viva donde los sistemas <strong>nervioso, respiratorio y digestivo</strong> trabajan coordinadamente en todo momento.
        <br>
        <em>Situación cotidiana:</em> Una estudiante corre en una competencia deportiva escolar. Analiza cómo sus sistemas cooperan en perfecta sincronía.
      `,
      preguntas: [
        {
          id: 'fin_1',
          tipo: 'opcion',
          enunciado: 'Cuando la estudiante decide acelerar su paso en la carrera, ¿cómo colaboran de inmediato el sistema nervioso y el respiratorio?',
          opciones: [
            'El sistema nervioso detecta el esfuerzo y ordena acelerar la ventilación pulmonar para ingresar más oxígeno',
            'El sistema respiratorio detiene la entrada de aire para ahorrar energía cerebral',
            'Los nervios bloquean los músculos para que la respiración descanse',
            'Los pulmones envían órdenes voluntarias directamente a las zapatillas de la atleta'
          ],
          correcta: 0,
          explicacion: 'El centro respiratorio en el encéfalo detecta el esfuerzo y el aumento de CO₂, emitiendo impulsos nerviosos para acelerar el ritmo y profundidad de la respiración.',
          pista: 'El sistema nervioso actúa como director de orquesta que le indica a los pulmones tocar más rápido.',
          ejemplo: 'Antes incluso de que te des cuenta de tu cansancio, tu cerebro ya ordenó a tu diafragma moverse más rápido.'
        },
        {
          id: 'fin_2',
          tipo: 'opcion',
          enunciado: 'Para que las células musculares de las piernas generen energía en movimiento, ¿qué dos insumos vitales provienen respectivamente de la digestión y de la respiración?',
          opciones: [
            'Glucosa (nutrientes del sistema digestivo) y oxígeno (incorporado por el sistema respiratorio)',
            'Ácido clorhídrico del estómago y dióxido de carbono de los alvéolos',
            'Bilis del hígado y cartílagos de la tráquea',
            'Saliva de la boca y moco de las fosas nasales'
          ],
          correcta: 0,
          explicacion: 'La respiración celular utiliza la glucosa aportada por la digestión y el oxígeno aportado por la respiración para sintetizar ATP (energía) indispensable para el movimiento.',
          pista: 'Necesitas el combustible que comiste en el desayuno y el gas vital que respiras segundo a segundo.',
          ejemplo: 'Como una fogata: necesita madera (glucosa) y aire (oxígeno) para producir calor y llama (energía muscular).'
        },
        {
          id: 'fin_3',
          tipo: 'opcion',
          enunciado: '¿Qué sistema del cuerpo humano actúa como la gran vía de transporte común que enlaza los alvéolos pulmonares y el intestino delgado con los músculos activos?',
          opciones: [
            'El sistema circulatorio a través de la sangre impulsada por el corazón',
            'El sistema óseo a través del interior rígido de los huesos',
            'El sistema digestivo grueso',
            'Exclusivamente los nervios de la columna'
          ],
          correcta: 0,
          explicacion: 'El sistema circulatorio es el nexo integrador: recoge el O₂ en los alvéolos y los nutrientes en el intestino delgado, distribuyéndolos simultáneamente por la sangre a los tejidos.',
          pista: 'Es el sistema con venas, arterias y un corazón que bombea sin descanso.',
          ejemplo: 'Es la red de autopistas y ríos de sangre por donde viajan tanto los alimentos como el aire respirado.'
        },
        {
          id: 'fin_4',
          tipo: 'opcion',
          enunciado: 'Durante la carrera, las células musculares producen gran cantidad de dióxido de carbono tóxico. ¿Cómo colaboran la sangre y los pulmones para su evacuación?',
          opciones: [
            'La sangre transporta el CO₂ a los capilares alveolares y los pulmones lo expulsan con la exhalación',
            'El CO₂ es almacenado en el estómago hasta terminar la jornada escolar',
            'Los nervios lo transforman en glucosa para continuar corriendo',
            'Los alvéolos lo devuelven a los músculos para que no se cansen'
          ],
          correcta: 0,
          explicacion: 'El dióxido de carbono viaja por el torrente sanguíneo hacia los alvéolos pulmonares, difunde hacia el aire alveolar y es expulsado rápidamente en la espiración.',
          pista: 'El torrente sanguíneo recoge la basura química celular y la entrega a los pulmones para que la expulsen al aire.',
          ejemplo: 'Al terminar de correr jadeas intensamente: tu cuerpo está apresurándose a eliminar todo el CO₂ acumulado.'
        },
        {
          id: 'fin_5',
          tipo: 'opcion',
          enunciado: 'A partir de todo lo aprendido en el escape room, ¿cuál es la conclusión científica fundamental sobre el cuerpo humano?',
          opciones: [
            'Es un sistema altamente integrado e interdependiente: si uno de los sistemas falla, los demás no pueden cumplir sus funciones',
            'Los órganos del cuerpo son independientes y no se relacionan en absoluto entre sí',
            'El sistema nervioso puede funcionar normalmente sin oxígeno ni nutrientes',
            'La digestión solo tiene como fin generar desechos y no influye en la energía del movimiento'
          ],
          correcta: 0,
          explicacion: 'La homeostasis y la vida dependen de la integración armónica de todos los sistemas: el nervioso coordina, el respiratorio oxigena, el digestivo nutre y el circulatorio comunica.',
          pista: 'El cuerpo es un gran equipo en el que todos los jugadores dependen unos de otros para ganar el partido de la vida.',
          ejemplo: 'Si el corazón se detiene, el cerebro no recibe oxígeno; si los pulmones fallan, las células mueren; todos trabajan en equipo.'
        }
      ]
    }
  }
};

// --- ESTADO GLOBAL DE LA PARTIDA ---
let estado = {
  pantalla: 'inicio', // 'inicio' | 'mapa' | 'sala' | 'resultados'
  salaActual: null,
  preguntaIndice: 0,
  intentosActuales: 0, // Intentos en la pregunta en curso (0 a 3)
  puntos: {
    nervioso: 0,
    respiratorio: 0,
    digestivo: 0,
    final: 0
  },
  completados: {
    nervioso: false,
    respiratorio: false,
    digestivo: false,
    final: false
  },
  insignias: [],
  respuestasDetalle: {} // Guardado de puntos por pregunta
};

// Intentar restaurar sesión guardada
cargarEstadoStorage();

// Inicializar la interfaz en pantalla
renderizar();

/**
 * Carga el progreso previo si existe en sessionStorage.
 */
function cargarEstadoStorage() {
  try {
    const raw = sessionStorage.getItem(CLAVE_STORAGE);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.puntos) {
        estado = { ...estado, ...data };
      }
    }
  } catch (err) {
    console.warn('No se pudo restaurar estado de escape room:', err);
  }
}

/**
 * Guarda el progreso en sessionStorage.
 */
function guardarEstadoStorage() {
  try {
    sessionStorage.setItem(CLAVE_STORAGE, JSON.stringify(estado));
  } catch (err) {
    console.warn('No se pudo guardar estado en storage:', err);
  }
}

/**
 * Calcula el puntaje total actual (máximo 100).
 */
function calcularPuntajeTotal() {
  return (
    (estado.puntos.nervioso || 0) +
    (estado.puntos.respiratorio || 0) +
    (estado.puntos.digestivo || 0) +
    (estado.puntos.final || 0)
  );
}

/**
 * Renderizador central del juego.
 */
function renderizar() {
  if (!contenedor) return;

  if (estado.pantalla === 'inicio') {
    renderizarInicio();
  } else if (estado.pantalla === 'mapa') {
    renderizarMapa();
  } else if (estado.pantalla === 'sala') {
    renderizarSala();
  } else if (estado.pantalla === 'resultados') {
    renderizarResultados();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * 1. PANTALLA INICIAL (NARRATIVA Y MISIÓN)
 */
function renderizarInicio() {
  contenedor.innerHTML = `
    <div class="escape-contenedor">
      <section class="escape-hero">
        <span class="escape-hero__badge">🔬 Escape Room Científico · 9.º de EGB</span>
        <h1 class="escape-hero__titulo">Escape del cuerpo humano</h1>
        <p class="escape-hero__descripcion">
          ¡Atención, explorador científico! Has ingresado a un simulador de exploración biológica en tamaño microscópico. 
          Para desbloquear el <strong>centro de control del organismo</strong> y lograr escapar con éxito, 
          debes atravesar tres salas especializadas (Sistemas Nervioso, Respiratorio y Digestivo) y descifrar el código integrador final.
        </p>
        <div class="fila" style="gap: var(--espacio-m); margin-top: var(--espacio-l); flex-wrap: wrap;">
          <button id="btnComenzarMision" class="btn btn--primario" style="background-color: var(--color-acento); border-color: var(--color-acento); font-size: var(--texto-m); padding: var(--espacio-m) var(--espacio-l);" type="button">
            🚀 Comenzar misión
          </button>
          <a href="/paginas/asignaturas.html" class="btn btn--secundario" style="font-size: var(--texto-m);">
            ← Volver a Mis Asignaturas
          </a>
        </div>
      </section>

      <!-- Instrucciones Pedagógicas de la Misión -->
      <section class="pila" style="gap: var(--espacio-m);">
        <h2 style="font-size: var(--texto-xl); color: var(--color-primario); margin: 0;">
          📋 Protocolo de la Misión y Sistema de Puntuación
        </h2>

        <div class="escape-mision-grid">
          <article class="escape-mision-card">
            <div class="escape-mision-card__icono">🧠</div>
            <strong style="color: var(--color-primario); font-size: var(--texto-m);">1. Tres Salas de Exploración</strong>
            <p style="color: var(--color-texto-suave); font-size: var(--texto-s); margin: 0;">
              Investiga las estructuras del sistema nervioso, la ruta del oxígeno en la respiración y la transformación de nutrientes en la digestión (25 pts cada una).
            </p>
          </article>

          <article class="escape-mision-card">
            <div class="escape-mision-card__icono">🧬</div>
            <strong style="color: var(--color-primario); font-size: var(--texto-m);">2. Desafío Final Integrador</strong>
            <p style="color: var(--color-texto-suave); font-size: var(--texto-s); margin: 0;">
              Al superar las tres salas, desbloquearás la misión integradora que evalúa cómo los tres sistemas trabajan en conjunto durante el movimiento (25 pts).
            </p>
          </article>

          <article class="escape-mision-card">
            <div class="escape-mision-card__icono">⭐</div>
            <strong style="color: var(--color-primario); font-size: var(--texto-m);">3. Razonamiento y Puntos</strong>
            <p style="color: var(--color-texto-suave); font-size: var(--texto-s); margin: 0;">
              Acierto al 1.er intento: <strong>5 pts</strong>. Al 2.º intento: <strong>3 pts</strong>. Al 3.er intento: <strong>1 pt</strong>. 
              Necesitas <strong>al menos 70 de 100 puntos</strong> para escapar con éxito.
            </p>
          </article>
        </div>
      </section>
    </div>
  `;

  document.getElementById('btnComenzarMision')?.addEventListener('click', () => {
    estado.pantalla = 'mapa';
    guardarEstadoStorage();
    renderizar();
  });
}

/**
 * 2. MAPA DEL CUERPO HUMANO (HUB PRINCIPAL DE SALAS)
 */
function renderizarMapa() {
  const puntajeTotal = calcularPuntajeTotal();
  const puedeAccederFinal =
    estado.completados.nervioso &&
    estado.completados.respiratorio &&
    estado.completados.digestivo;

  const todasCompletadas = puedeAccederFinal && estado.completados.final;

  contenedor.innerHTML = `
    <div class="escape-contenedor">
      <!-- Cabecera del Mapa / Marcador de Navegación -->
      <header class="escape-mapa-cabecera">
        <div class="pila" style="gap: var(--espacio-xs);">
          <div class="fila" style="align-items: center; gap: var(--espacio-xs);">
            <a href="/index.html" class="btn btn--texto btn--pequeno" style="padding-left: 0;">← Inicio</a>
            <span style="color: var(--color-borde);">/</span>
            <span style="font-size: var(--texto-xs); color: var(--color-texto-suave);">Panel de Exploración</span>
          </div>
          <h1 style="font-size: var(--texto-xl); color: var(--color-primario); margin: 0;">
            Centro de Control: Salas del Organismo
          </h1>
        </div>

        <div class="escape-marcador">
          <div class="escape-marcador__item">
            <span class="escape-marcador__etiqueta">Puntuación Total</span>
            <span class="escape-marcador__valor">${puntajeTotal} / 100 pts</span>
          </div>
          <div class="escape-marcador__item">
            <span class="escape-marcador__etiqueta">Meta para Escapar</span>
            <span class="escape-marcador__valor" style="color: var(--color-exito);">≥ 70 pts</span>
          </div>
          <button id="btnReiniciarJuego" class="btn btn--texto btn--pequeno" type="button" title="Reiniciar toda la partida">
            ↺ Reiniciar partida
          </button>
        </div>
      </header>

      <!-- Grid de las 3 Salas + Misión Final -->
      <section class="escape-zonas-grid">
        <!-- Sala 1: Sistema Nervioso -->
        <article class="escape-zona-tarjeta ${estado.completados.nervioso ? 'escape-zona-tarjeta--completada' : ''}">
          <div class="escape-zona-tarjeta__top">
            <div class="escape-zona-tarjeta__icono">🧠</div>
            <span class="insignia ${estado.completados.nervioso ? 'insignia--exito' : 'insignia--info'}">
              ${estado.completados.nervioso ? 'Completado ✓' : 'Disponible'}
            </span>
          </div>
          <div>
            <h2 class="escape-zona-tarjeta__titulo">Nivel 1: Centro de control</h2>
            <small style="color: var(--color-acento); font-weight: var(--peso-seminegrita);">Sistema Nervioso</small>
            <p class="escape-zona-tarjeta__desc" style="margin-top: var(--espacio-xs);">
              Explora las funciones del encéfalo, la médula espinal, los nervios periféricos y la coordinación ante estímulos cotidianos.
            </p>
          </div>
          <div class="fila" style="justify-content: space-between; align-items: center; border-top: 1px solid var(--color-borde); padding-top: var(--espacio-s);">
            <span style="font-size: var(--texto-xs); color: var(--color-texto-suave);">
              Puntos: <strong>${estado.puntos.nervioso} / 25</strong>
            </span>
            <button class="btn btn--primario btn--pequeno btnEntrarSala" data-sala="nervioso" type="button">
              ${estado.completados.nervioso ? 'Revisar sala ↻' : 'Ingresar a la sala →'}
            </button>
          </div>
        </article>

        <!-- Sala 2: Sistema Respiratorio -->
        <article class="escape-zona-tarjeta ${estado.completados.respiratorio ? 'escape-zona-tarjeta--completada' : ''}">
          <div class="escape-zona-tarjeta__top">
            <div class="escape-zona-tarjeta__icono">🫁</div>
            <span class="insignia ${estado.completados.respiratorio ? 'insignia--exito' : 'insignia--info'}">
              ${estado.completados.respiratorio ? 'Completado ✓' : 'Disponible'}
            </span>
          </div>
          <div>
            <h2 class="escape-zona-tarjeta__titulo">Nivel 2: Misión oxígeno</h2>
            <small style="color: var(--color-acento); font-weight: var(--peso-seminegrita);">Sistema Respiratorio</small>
            <p class="escape-zona-tarjeta__desc" style="margin-top: var(--espacio-xs);">
              Recorre las vías respiratorias, ordena la ruta del aire e identifica el intercambio de oxígeno y dióxido de carbono en los alvéolos.
            </p>
          </div>
          <div class="fila" style="justify-content: space-between; align-items: center; border-top: 1px solid var(--color-borde); padding-top: var(--espacio-s);">
            <span style="font-size: var(--texto-xs); color: var(--color-texto-suave);">
              Puntos: <strong>${estado.puntos.respiratorio} / 25</strong>
            </span>
            <button class="btn btn--primario btn--pequeno btnEntrarSala" data-sala="respiratorio" type="button">
              ${estado.completados.respiratorio ? 'Revisar sala ↻' : 'Ingresar a la sala →'}
            </button>
          </div>
        </article>

        <!-- Sala 3: Sistema Digestivo -->
        <article class="escape-zona-tarjeta ${estado.completados.digestivo ? 'escape-zona-tarjeta--completada' : ''}">
          <div class="escape-zona-tarjeta__top">
            <div class="escape-zona-tarjeta__icono">🥗</div>
            <span class="insignia ${estado.completados.digestivo ? 'insignia--exito' : 'insignia--info'}">
              ${estado.completados.digestivo ? 'Completado ✓' : 'Disponible'}
            </span>
          </div>
          <div>
            <h2 class="escape-zona-tarjeta__titulo">Nivel 3: La ruta de los alimentos</h2>
            <small style="color: var(--color-acento); font-weight: var(--peso-seminegrita);">Sistema Digestivo</small>
            <p class="escape-zona-tarjeta__desc" style="margin-top: var(--espacio-xs);">
              Sigue la transformación digestiva, ordena los órganos del tubo digestivo y descubre cómo se absorben los nutrientes hacia la sangre.
            </p>
          </div>
          <div class="fila" style="justify-content: space-between; align-items: center; border-top: 1px solid var(--color-borde); padding-top: var(--espacio-s);">
            <span style="font-size: var(--texto-xs); color: var(--color-texto-suave);">
              Puntos: <strong>${estado.puntos.digestivo} / 25</strong>
            </span>
            <button class="btn btn--primario btn--pequeno btnEntrarSala" data-sala="digestivo" type="button">
              ${estado.completados.digestivo ? 'Revisar sala ↻' : 'Ingresar a la sala →'}
            </button>
          </div>
        </article>

        <!-- Desafío Final: Integrador -->
        <article class="escape-zona-tarjeta escape-zona-tarjeta--final ${!puedeAccederFinal ? 'escape-zona-tarjeta--bloqueada' : ''} ${estado.completados.final ? 'escape-zona-tarjeta--completada' : ''}">
          <div class="escape-zona-tarjeta__top">
            <div class="escape-zona-tarjeta__icono">🧬</div>
            <span class="insignia ${estado.completados.final ? 'insignia--exito' : puedeAccederFinal ? 'insignia--advertencia' : 'insignia--error'}">
              ${estado.completados.final ? 'Misión Final Superada ✓' : puedeAccederFinal ? '¡Desbloqueado!' : '🔒 Bloqueado'}
            </span>
          </div>
          <div>
            <h2 class="escape-zona-tarjeta__titulo">Desafío Final: El código del organismo</h2>
            <small style="color: var(--color-primario); font-weight: var(--peso-seminegrita);">Misión Integradora Global (25 pts)</small>
            <p class="escape-zona-tarjeta__desc" style="margin-top: var(--espacio-xs);">
              ${
                puedeAccederFinal
                  ? '¡Excelente trabajo! Has activado las 3 salas biológicas. Ahora demuestra cómo cooperan los tres sistemas en un caso real de esfuerzo físico.'
                  : 'Completa primero las tres salas anteriores (Nervioso, Respiratorio y Digestivo) para descifrar el código maestro del organismo.'
              }
            </p>
          </div>
          <div class="fila" style="justify-content: space-between; align-items: center; border-top: 1px solid var(--color-borde); padding-top: var(--espacio-s);">
            <span style="font-size: var(--texto-xs); color: var(--color-texto-suave);">
              Puntos: <strong>${estado.puntos.final} / 25</strong>
            </span>
            ${
              puedeAccederFinal
                ? `<button class="btn btn--primario btn--pequeno btnEntrarSala" data-sala="final" type="button" style="background-color: var(--color-acento); border-color: var(--color-acento);">
                    ${estado.completados.final ? 'Revisar desafío ↻' : 'Ingresar al Desafío Final ⚡'}
                  </button>`
                : `<button class="btn btn--secundario btn--pequeno" disabled type="button">🔒 Requiere completar salas 1, 2 y 3</button>`
            }
          </div>
        </article>
      </section>

      <!-- Botón para ver pantalla de resultados si ya terminó todo -->
      ${
        todasCompletadas
          ? `
        <div class="tarjeta fila" style="justify-content: space-between; align-items: center; background: linear-gradient(135deg, rgba(16, 124, 65, 0.08), rgba(0, 46, 69, 0.05)); border: 2px solid var(--color-exito);">
          <div>
            <h3 style="margin: 0; color: var(--color-exito); font-size: var(--texto-m);">
              🎉 ¡Has completado todos los desafíos del escape room!
            </h3>
            <p style="margin: 4px 0 0 0; font-size: var(--texto-s); color: var(--color-texto-suave);">
              Consulta tu evaluación detallada, resumen de logros y diploma de explorador.
            </p>
          </div>
          <button id="btnVerResultados" class="btn btn--primario" type="button" style="background-color: var(--color-exito); border-color: var(--color-exito);">
            🏆 Ver resultados finales
          </button>
        </div>
      `
          : ''
      }
    </div>
  `;

  // Listeners de navegación
  document.querySelectorAll('.btnEntrarSala').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sala = btn.getAttribute('data-sala');
      if (sala) {
        entrarSala(sala);
      }
    });
  });

  document.getElementById('btnVerResultados')?.addEventListener('click', () => {
    estado.pantalla = 'resultados';
    guardarEstadoStorage();
    renderizar();
  });

  document.getElementById('btnReiniciarJuego')?.addEventListener('click', async () => {
    const seguro = await ui.confirmar(
      '¿Estás seguro de que deseas reiniciar toda la partida? Se restablecerán tus puntos y desafíos de esta sesión.'
    );
    if (seguro) {
      reiniciarPartida();
    }
  });
}

/**
 * Entra a una sala de desafíos.
 */
function entrarSala(salaId) {
  estado.salaActual = salaId;
  estado.preguntaIndice = 0;
  estado.intentosActuales = 0;
  estado.pantalla = 'sala';
  guardarEstadoStorage();
  renderizar();
}

/**
 * 3. SALA DE DESAFÍOS (INTERACCIÓN, INTENTOS Y ASISTENTE IA)
 */
function renderizarSala() {
  const sala = DATOS_JUEGO.salas[estado.salaActual];
  if (!sala) {
    estado.pantalla = 'mapa';
    renderizar();
    return;
  }

  const totalPreguntas = sala.preguntas.length;
  const pregunta = sala.preguntas[estado.preguntaIndice];

  // Cálculo de puntos del nivel
  const puntosNivel = estado.puntos[estado.salaActual] || 0;

  contenedor.innerHTML = `
    <div class="escape-contenedor">
      <!-- Cabecera de la Sala -->
      <header class="escape-sala-header">
        <div class="fila" style="align-items: center; gap: var(--espacio-s);">
          <button id="btnVolverAlMapa" class="btn btn--secundario btn--pequeno" type="button">
            ← Volver al mapa
          </button>
          <div class="fila" style="align-items: center; gap: var(--espacio-xs);">
            <span style="font-size: var(--texto-xl);">${sala.icono}</span>
            <strong style="font-size: var(--texto-m); color: var(--color-texto-inverso);">${sala.nombre}</strong>
          </div>
        </div>

        <div class="fila" style="align-items: center; gap: var(--espacio-m);">
          <span style="font-size: var(--texto-s); color: var(--color-texto-inverso);">
            Reto <strong>${estado.preguntaIndice + 1}</strong> de <strong>${totalPreguntas}</strong>
          </span>
          <span class="insignia insignia--advertencia" style="font-size: var(--texto-xs); background-color: var(--color-superficie); color: var(--color-primario);">
            ⭐ ${puntosNivel} / 25 pts
          </span>
        </div>
      </header>

      <!-- Guía Científica / Resumen de la Sala (Desplegable) -->
      <details class="escape-briefing-box" ${estado.preguntaIndice === 0 ? 'open' : ''}>
        <summary>📖 Guía científica y conceptos del laboratorio (clic para consultar)</summary>
        <div style="font-size: var(--texto-s); line-height: var(--interlineado-normal); color: var(--color-texto); margin-top: var(--espacio-xs);">
          ${sala.resumen}
        </div>
      </details>

      <!-- Tarjeta del Reto Activo -->
      <article class="escape-reto-tarjeta" id="contenedorReto">
        <div class="escape-reto-meta">
          <span class="insignia insignia--info">Desafío interactivo</span>
          
          <div class="fila" style="align-items: center; gap: var(--espacio-s);">
            <small style="color: var(--color-texto-suave); font-size: var(--texto-xs);">Intentos en este reto:</small>
            <div class="escape-intentos-indicador">
              <span class="escape-intento-punto ${estado.intentosActuales === 0 ? 'escape-intento-punto--activo' : estado.intentosActuales > 0 ? 'escape-intento-punto--gastado' : ''}" title="1.er intento (5 pts)"></span>
              <span class="escape-intento-punto ${estado.intentosActuales === 1 ? 'escape-intento-punto--activo' : estado.intentosActuales > 1 ? 'escape-intento-punto--gastado' : ''}" title="2.º intento (3 pts)"></span>
              <span class="escape-intento-punto ${estado.intentosActuales === 2 ? 'escape-intento-punto--activo' : estado.intentosActuales > 2 ? 'escape-intento-punto--gastado' : ''}" title="3.er intento (1 pt con pista)"></span>
            </div>
            <span style="font-size: var(--texto-xs); font-weight: var(--peso-seminegrita); color: var(--color-primario);">
              Valor: ${estado.intentosActuales === 0 ? '5 pts' : estado.intentosActuales === 1 ? '3 pts' : estado.intentosActuales === 2 ? '1 pt' : '0 pts'}
            </span>
          </div>
        </div>

        <h3 class="escape-reto-enunciado">${ui.escapar(pregunta.enunciado)}</h3>

        <!-- Formato dinámico según tipo de pregunta -->
        <div id="escapeAreaPregunta">
          ${renderizarCuerpoPregunta(pregunta)}
        </div>

        <!-- Área de retroalimentación inmediata -->
        <div id="escapeAreaRetro"></div>

        <!-- Panel del Ayudante Científico con IA -->
        <div id="escapeAreaAsistente"></div>

        <!-- Botones de Acción -->
        <footer class="escape-reto-acciones">
          <div class="fila" style="gap: var(--espacio-s);">
            <button id="btnPedirAyudaIA" class="btn btn--secundario btn--pequeno" type="button">
              🤖 Consultar al Ayudante Científico
            </button>
          </div>

          <div class="fila" style="gap: var(--espacio-s);">
            <button id="btnVerificarRespuesta" class="btn btn--primario" type="button">
              Verificar respuesta
            </button>
            <button id="btnSiguientePregunta" class="btn btn--primario" style="display: none; background-color: var(--color-exito); border-color: var(--color-exito);" type="button">
              ${estado.preguntaIndice + 1 === totalPreguntas ? 'Finalizar sala →' : 'Siguiente reto →'}
            </button>
          </div>
        </footer>
      </article>
    </div>
  `;

  // Listeners
  document.getElementById('btnVolverAlMapa')?.addEventListener('click', () => {
    estado.pantalla = 'mapa';
    guardarEstadoStorage();
    renderizar();
  });

  configurarInteraccionesPregunta(pregunta);

  document.getElementById('btnPedirAyudaIA')?.addEventListener('click', () => {
    abrirAyudanteCientifico(pregunta);
  });
}

/**
 * Renderiza el cuerpo de la pregunta según su tipo (opcion múltiple, ordenar).
 */
function renderizarCuerpoPregunta(pregunta) {
  if (pregunta.tipo === 'opcion') {
    const letras = ['A', 'B', 'C', 'D'];
    return `
      <div class="escape-opciones-lista" role="radiogroup" aria-label="Opciones de respuesta">
        ${pregunta.opciones
          .map(
            (op, idx) => `
          <button type="button" class="escape-opcion-btn" data-indice="${idx}" role="radio" aria-checked="false">
            <span class="escape-opcion-letra">${letras[idx]}</span>
            <span>${ui.escapar(op)}</span>
          </button>
        `
          )
          .join('')}
      </div>
    `;
  }

  if (pregunta.tipo === 'ordenar') {
    // Si no se han barajado en este turno, barajar para desafiar al estudiante
    if (!pregunta._elementosDesordenados) {
      pregunta._elementosDesordenados = util.barajar([...pregunta.elementosCorrectos]);
    }

    return `
      <div class="pila" style="gap: var(--espacio-s);">
        <small style="color: var(--color-texto-suave);">
          Usa los botones <strong>▲ Subir</strong> y <strong>▼ Bajar</strong> para colocar los pasos en el orden biológico correcto:
        </small>
        <div class="escape-orden-lista" id="listaParaOrdenar">
          ${pregunta._elementosDesordenados
            .map(
              (elem, idx) => `
            <div class="escape-orden-item" data-idx="${idx}">
              <div class="fila" style="align-items: center; gap: var(--espacio-s);">
                <span class="insignia insignia--info" style="font-size: var(--texto-xs);">${idx + 1}</span>
                <span class="escape-orden-item__texto">${ui.escapar(elem)}</span>
              </div>
              <div class="escape-orden-controles">
                <button type="button" class="escape-btn-ordenar btnSubir" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''}>▲ Subir</button>
                <button type="button" class="escape-btn-ordenar btnBajar" data-idx="${idx}" ${idx === pregunta._elementosDesordenados.length - 1 ? 'disabled' : ''}>▼ Bajar</button>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  return '';
}

/**
 * Conecta los listeners del cuerpo de pregunta y la lógica de verificación.
 */
function configurarInteraccionesPregunta(pregunta) {
  let seleccionActual = null;

  // 1. Caso Opción Múltiple
  if (pregunta.tipo === 'opcion') {
    const btns = document.querySelectorAll('.escape-opcion-btn');
    btns.forEach((btn) => {
      btn.addEventListener('click', () => {
        btns.forEach((b) => {
          b.classList.remove('escape-opcion-btn--seleccionado');
          b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('escape-opcion-btn--seleccionado');
        btn.setAttribute('aria-checked', 'true');
        seleccionActual = parseInt(btn.getAttribute('data-indice'), 10);
      });
    });
  }

  // 2. Caso Ordenamiento
  if (pregunta.tipo === 'ordenar') {
    const actualizarLista = () => {
      const contenedorLista = document.getElementById('listaParaOrdenar');
      if (!contenedorLista) return;
      contenedorLista.innerHTML = pregunta._elementosDesordenados
        .map(
          (elem, idx) => `
        <div class="escape-orden-item" data-idx="${idx}">
          <div class="fila" style="align-items: center; gap: var(--espacio-s);">
            <span class="insignia insignia--info" style="font-size: var(--texto-xs);">${idx + 1}</span>
            <span class="escape-orden-item__texto">${ui.escapar(elem)}</span>
          </div>
          <div class="escape-orden-controles">
            <button type="button" class="escape-btn-ordenar btnSubir" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''}>▲ Subir</button>
            <button type="button" class="escape-btn-ordenar btnBajar" data-idx="${idx}" ${idx === pregunta._elementosDesordenados.length - 1 ? 'disabled' : ''}>▼ Bajar</button>
          </div>
        </div>
      `
        )
        .join('');

      conectarControlesOrden();
    };

    const conectarControlesOrden = () => {
      document.querySelectorAll('.btnSubir').forEach((b) => {
        b.addEventListener('click', () => {
          const idx = parseInt(b.getAttribute('data-idx'), 10);
          if (idx > 0) {
            const temp = pregunta._elementosDesordenados[idx];
            pregunta._elementosDesordenados[idx] = pregunta._elementosDesordenados[idx - 1];
            pregunta._elementosDesordenados[idx - 1] = temp;
            actualizarLista();
          }
        });
      });

      document.querySelectorAll('.btnBajar').forEach((b) => {
        b.addEventListener('click', () => {
          const idx = parseInt(b.getAttribute('data-idx'), 10);
          if (idx < pregunta._elementosDesordenados.length - 1) {
            const temp = pregunta._elementosDesordenados[idx];
            pregunta._elementosDesordenados[idx] = pregunta._elementosDesordenados[idx + 1];
            pregunta._elementosDesordenados[idx + 1] = temp;
            actualizarLista();
          }
        });
      });
    };

    conectarControlesOrden();
  }

  // 3. Botón de Verificación de Respuesta
  const btnVerificar = document.getElementById('btnVerificarRespuesta');
  const btnSiguiente = document.getElementById('btnSiguientePregunta');
  const areaRetro = document.getElementById('escapeAreaRetro');

  btnVerificar?.addEventListener('click', () => {
    let esCorrecto = false;

    if (pregunta.tipo === 'opcion') {
      if (seleccionActual === null) {
        ui.aviso('Por favor selecciona una alternativa de respuesta antes de verificar.', 'advertencia');
        return;
      }
      esCorrecto = seleccionActual === pregunta.correcta;
    } else if (pregunta.tipo === 'ordenar') {
      esCorrecto = pregunta._elementosDesordenados.every(
        (val, i) => val === pregunta.elementosCorrectos[i]
      );
    }

    procesarResultadoRespuesta(esCorrecto, pregunta, seleccionActual);
  });

  btnSiguiente?.addEventListener('click', () => {
    avanzarSiguienteReto();
  });
}

/**
 * Evalúa el intento y aplica el sistema de puntuación (5, 3, 1, 0 pts).
 */
function procesarResultadoRespuesta(esCorrecto, pregunta, seleccionIndice) {
  const btnVerificar = document.getElementById('btnVerificarRespuesta');
  const btnSiguiente = document.getElementById('btnSiguientePregunta');
  const areaRetro = document.getElementById('escapeAreaRetro');

  if (esCorrecto) {
    // Calcular puntos según el número de intentos
    let puntosGanados = 0;
    if (estado.intentosActuales === 0) puntosGanados = 5;
    else if (estado.intentosActuales === 1) puntosGanados = 3;
    else puntosGanados = 1;

    // Sumar a la sala actual
    estado.puntos[estado.salaActual] = (estado.puntos[estado.salaActual] || 0) + puntosGanados;

    // Resaltar opciones si aplica
    if (pregunta.tipo === 'opcion') {
      const btns = document.querySelectorAll('.escape-opcion-btn');
      btns.forEach((b, idx) => {
        b.disabled = true;
        if (idx === pregunta.correcta) {
          b.classList.add('escape-opcion-btn--correcto');
        }
      });
    }

    areaRetro.innerHTML = `
      <div class="alerta alerta--exito" style="margin-top: var(--espacio-m);">
        <span style="font-size: var(--texto-2xl);">🎉</span>
        <div class="pila" style="gap: var(--espacio-xs); flex: 1;">
          <strong style="color: var(--color-exito);">¡Respuesta correcta! (+${puntosGanados} pts)</strong>
          <p style="margin: 0; font-size: var(--texto-s);">${ui.escapar(pregunta.explicacion)}</p>
        </div>
      </div>
    `;

    btnVerificar.style.display = 'none';
    btnSiguiente.style.display = 'inline-flex';
    guardarEstadoStorage();
  } else {
    // Incorrecto
    estado.intentosActuales += 1;

    if (pregunta.tipo === 'opcion' && seleccionIndice !== null) {
      const btnIncorrecto = document.querySelector(`.escape-opcion-btn[data-indice="${seleccionIndice}"]`);
      btnIncorrecto?.classList.add('escape-opcion-btn--incorrecto');
    }

    if (estado.intentosActuales < 3) {
      // Le quedan intentos
      const intentosRestantes = 3 - estado.intentosActuales;
      const puntosSiguientes = estado.intentosActuales === 1 ? '3 pts' : '1 pt';

      areaRetro.innerHTML = `
        <div class="alerta alerta--advertencia" style="margin-top: var(--espacio-m);">
          <span style="font-size: var(--texto-2xl);">💡</span>
          <div class="pila" style="gap: var(--espacio-xs); flex: 1;">
            <strong style="color: var(--color-advertencia);">Respuesta no acertada</strong>
            <p style="margin: 0; font-size: var(--texto-s);">
              Te quedan <strong>${intentosRestantes} ${intentosRestantes === 1 ? 'intento' : 'intentos'}</strong> (siguiente acierto: <strong>${puntosSiguientes}</strong>).
            </p>
            <p style="margin: 4px 0 0 0; font-size: var(--texto-xs); color: var(--color-texto-suave);">
              <em>Pista pedagógica:</em> ${ui.escapar(pregunta.pista)}
            </p>
          </div>
        </div>
      `;
      // Actualizar marcador de puntos en la cabecera del reto
      const puntosIndicadores = document.querySelectorAll('.escape-intento-punto');
      if (puntosIndicadores[estado.intentosActuales - 1]) {
        puntosIndicadores[estado.intentosActuales - 1].className = 'escape-intento-punto escape-intento-punto--gastado';
      }
      if (puntosIndicadores[estado.intentosActuales]) {
        puntosIndicadores[estado.intentosActuales].className = 'escape-intento-punto escape-intento-punto--activo';
      }
    } else {
      // Agotó los 3 intentos: 0 puntos
      areaRetro.innerHTML = `
        <div class="alerta alerta--error" style="margin-top: var(--espacio-m);">
          <span style="font-size: var(--texto-2xl);">⚠️</span>
          <div class="pila" style="gap: var(--espacio-xs); flex: 1;">
            <strong style="color: var(--color-error);">Has agotado los 3 intentos (+0 pts)</strong>
            <p style="margin: 0; font-size: var(--texto-s);">
              <strong>Explicación científica:</strong> ${ui.escapar(pregunta.explicacion)}
            </p>
            ${
              pregunta.tipo === 'ordenar'
                ? `<p style="margin: 4px 0 0 0; font-size: var(--texto-xs); color: var(--color-exito);">
                    <strong>Orden correcto:</strong> ${pregunta.elementosCorrectos.join(' → ')}
                  </p>`
                : ''
            }
          </div>
        </div>
      `;

      if (pregunta.tipo === 'opcion') {
        const btns = document.querySelectorAll('.escape-opcion-btn');
        btns.forEach((b, idx) => {
          b.disabled = true;
          if (idx === pregunta.correcta) {
            b.classList.add('escape-opcion-btn--correcto');
          }
        });
      }

      btnVerificar.style.display = 'none';
      btnSiguiente.style.display = 'inline-flex';
      guardarEstadoStorage();
    }
  }
}

/**
 * Avanza al siguiente reto o finaliza la sala otorgando insignia.
 */
function avanzarSiguienteReto() {
  const sala = DATOS_JUEGO.salas[estado.salaActual];
  delete sala.preguntas[estado.preguntaIndice]._elementosDesordenados;

  estado.preguntaIndice += 1;
  estado.intentosActuales = 0;

  if (estado.preguntaIndice >= sala.preguntas.length) {
    // Sala completada
    estado.completados[estado.salaActual] = true;

    // Desbloquear insignia si aún no se tiene
    if (sala.insignia && !estado.insignias.includes(sala.insignia.id)) {
      estado.insignias.push(sala.insignia.id);
      ui.aviso(`🏆 ¡Nueva insignia obtenida: «${sala.insignia.nombre}»!`, 'exito');
    }

    guardarEstadoStorage();

    // Si completó la final o las 3 salas, regresar a mapa o resultados
    if (estado.salaActual === 'final') {
      // Registrar intento en el servidor si hay usuario autenticado
      registrarIntentoServidor();
      estado.pantalla = 'resultados';
    } else {
      estado.pantalla = 'mapa';
    }
    renderizar();
  } else {
    // Siguiente pregunta
    guardarEstadoStorage();
    renderizar();
  }
}

/**
 * 4. ASISTENTE EDUCATIVO: «AYUDANTE CIENTÍFICO» CON IA / FALLBACK
 */
async function abrirAyudanteCientifico(pregunta) {
  const areaAsistente = document.getElementById('escapeAreaAsistente');
  if (!areaAsistente) return;

  areaAsistente.innerHTML = `
    <div class="escape-asistente-box">
      <div class="fila" style="justify-content: space-between; align-items: center;">
        <div class="fila" style="align-items: center; gap: var(--espacio-xs);">
          <span style="font-size: var(--texto-xl);">🤖</span>
          <strong style="color: var(--color-primario); font-size: var(--texto-s);">Ayudante Científico Virtual</strong>
        </div>
        <button id="btnCerrarAsistente" class="btn btn--texto btn--pequeno" type="button">✕ Cerrar</button>
      </div>

      <p style="margin: 0; font-size: var(--texto-xs); color: var(--color-texto-suave);">
        ¿En qué necesitas orientación para este desafío de 9.º de EGB?
      </p>

      <div class="fila" style="gap: var(--espacio-xs); flex-wrap: wrap;">
        <button class="btn btn--pequeno btn--secundario btnOpcionIA" data-tipo="pista" type="button">
          💡 Dame una pista orientadora
        </button>
        <button class="btn btn--pequeno btn--secundario btnOpcionIA" data-tipo="ejemplo" type="button">
          🌍 Ver un ejemplo cotidiano
        </button>
        <button class="btn btn--pequeno btn--secundario btnOpcionIA" data-tipo="concepto" type="button">
          🔍 Explicación paso a paso
        </button>
      </div>

      <div id="escapeRespuestaIA" class="escape-asistente-respuesta" style="display: none;"></div>
    </div>
  `;

  document.getElementById('btnCerrarAsistente')?.addEventListener('click', () => {
    areaAsistente.innerHTML = '';
  });

  document.querySelectorAll('.btnOpcionIA').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const tipo = btn.getAttribute('data-tipo');
      const boxRespuesta = document.getElementById('escapeRespuestaIA');
      if (!boxRespuesta) return;

      boxRespuesta.style.display = 'block';
      boxRespuesta.innerHTML = `<em>El Ayudante Científico está consultando la biblioteca biológica...</em>`;

      // Intentar consultar a la IA del sistema si hay sesión activa
      let respuestaGenerada = null;
      const usuario = usuarioActual();

      if (usuario) {
        try {
          const consultaTutor = `Como Ayudante Científico para 9.º de EGB en el juego Escape del cuerpo humano, proporciona una respuesta corta (máximo 2 párrafos) de tipo "${tipo}" para la siguiente pregunta sin revelar directamente la alternativa correcta: "${pregunta.enunciado}".`;
          const resp = await api.ia('tutor', {
            asignaturaId: 'asi_000001',
            consulta: consultaTutor
          });
          if (resp && resp.respuesta) {
            respuestaGenerada = resp.respuesta;
          }
        } catch (e) {
          console.warn('Fallback a conocimiento predefinido del asistente:', e);
        }
      }

      // Si no hay respuesta de la IA o el usuario es anónimo, usar el banco científico local
      if (!respuestaGenerada) {
        if (tipo === 'pista') {
          respuestaGenerada = `💡 **Pista orientadora:** ${pregunta.pista}`;
        } else if (tipo === 'ejemplo') {
          respuestaGenerada = `🌍 **Ejemplo de la vida diaria:** ${pregunta.ejemplo || pregunta.pista}`;
        } else {
          respuestaGenerada = `🔍 **Concepto clave:** ${pregunta.explicacion}`;
        }
      }

      boxRespuesta.innerHTML = util.formatoBasico(respuestaGenerada);
    });
  });
}

/**
 * 5. PANTALLA DE RESULTADOS FINALES
 */
function renderizarResultados() {
  const puntajeTotal = calcularPuntajeTotal();
  const aprobado = puntajeTotal >= 70;

  contenedor.innerHTML = `
    <div class="escape-contenedor">
      <section class="escape-resultados-tarjeta">
        <div class="escape-badge-icono-grande">
          ${aprobado ? '🏆' : '🔬'}
        </div>

        <div class="pila" style="gap: var(--espacio-xs); max-width: 600px;">
          <span class="insignia ${aprobado ? 'insignia--exito' : 'insignia--advertencia'}" style="font-size: var(--texto-s);">
            ${aprobado ? '¡Misión cumplida! Has escapado del cuerpo humano' : 'Misión finalizada · Se requiere al menos 70 pts'}
          </span>
          <h1 style="font-size: var(--texto-3xl); color: var(--color-primario); margin: var(--espacio-xs) 0;">
            ${aprobado ? '¡Felicitaciones, Científico!' : '¡Buen intento de exploración!'}
          </h1>
          <p style="color: var(--color-texto-suave); font-size: var(--texto-m); margin: 0;">
            ${
              aprobado
                ? 'Has coordinado exitosamente los sistemas nervioso, respiratorio y digestivo, demostrando cómo cooperan armónicamente en el cuerpo humano.'
                : 'Exploraste los tres sistemas biológicos pero tu puntaje fue inferior a la meta de 70 puntos. Repasa los conceptos y vuelve a intentarlo.'
            }
          </p>
        </div>

        <!-- Indicador de Puntaje Total -->
        <div class="tarjeta fila" style="justify-content: center; align-items: center; gap: var(--espacio-xl); padding: var(--espacio-l) var(--espacio-2xl); background-color: var(--color-fondo); border: 2px solid ${aprobado ? 'var(--color-exito)' : 'var(--color-advertencia)'};">
          <div class="pila" style="align-items: center;">
            <span style="font-size: var(--texto-xs); color: var(--color-texto-suave); text-transform: uppercase;">Tu Puntuación Final</span>
            <strong style="font-size: 2.5rem; color: ${aprobado ? 'var(--color-exito)' : 'var(--color-advertencia)'}; line-height: 1;">
              ${puntajeTotal} <span style="font-size: var(--texto-l); font-weight: normal; color: var(--color-texto-suave);">/ 100</span>
            </strong>
          </div>
          <div style="border-left: 1px solid var(--color-borde); height: 50px;"></div>
          <div class="pila" style="align-items: center;">
            <span style="font-size: var(--texto-xs); color: var(--color-texto-suave); text-transform: uppercase;">Estado de Escape</span>
            <span style="font-size: var(--texto-l); font-weight: var(--peso-negrita); color: ${aprobado ? 'var(--color-exito)' : 'var(--color-error)'};">
              ${aprobado ? 'SUPERADO (Aprobado)' : 'NO SUPERADO (< 70)'}
            </span>
          </div>
        </div>

        <!-- Tabla Desglose por Salas -->
        <div class="pila" style="gap: var(--espacio-s); width: 100%; max-width: 700px;">
          <h3 style="margin: 0; font-size: var(--texto-m); color: var(--color-primario); text-align: left;">
            📊 Desglose de Rendimiento por Sistema:
          </h3>
          <table class="escape-resumen-niveles-tabla">
            <thead>
              <tr>
                <th>Sistema / Misión</th>
                <th>Desafíos</th>
                <th>Puntaje Obtenido</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>🧠 Nivel 1: Sistema Nervioso</td>
                <td>5 preguntas</td>
                <td><strong>${estado.puntos.nervioso} / 25 pts</strong></td>
                <td>${estado.completados.nervioso ? '✓ Completado' : 'Pendiente'}</td>
              </tr>
              <tr>
                <td>🫁 Nivel 2: Sistema Respiratorio</td>
                <td>5 preguntas</td>
                <td><strong>${estado.puntos.respiratorio} / 25 pts</strong></td>
                <td>${estado.completados.respiratorio ? '✓ Completado' : 'Pendiente'}</td>
              </tr>
              <tr>
                <td>🥗 Nivel 3: Sistema Digestivo</td>
                <td>5 preguntas</td>
                <td><strong>${estado.puntos.digestivo} / 25 pts</strong></td>
                <td>${estado.completados.digestivo ? '✓ Completado' : 'Pendiente'}</td>
              </tr>
              <tr>
                <td>🧬 Desafío Final: Código Integrador</td>
                <td>5 preguntas</td>
                <td><strong>${estado.puntos.final} / 25 pts</strong></td>
                <td>${estado.completados.final ? '✓ Completado' : 'Pendiente'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Vitrina de Insignias Obtenidas -->
        <div class="pila" style="gap: var(--espacio-s); width: 100%;">
          <h3 style="margin: 0; font-size: var(--texto-m); color: var(--color-primario);">
            🎖️ Insignias Desbloqueadas en la Misión:
          </h3>
          <div class="escape-insignias-grid">
            ${renderizarInsigniaCard('experto-coordinacion', '🧠', 'Experto en coordinación', 'Superaste el Nivel 1 (Sistema Nervioso)')}
            ${renderizarInsigniaCard('explorador-respiratorio', '🫁', 'Explorador respiratorio', 'Superaste el Nivel 2 (Sistema Respiratorio)')}
            ${renderizarInsigniaCard('maestro-digestion', '🥗', 'Maestro de la digestión', 'Superaste el Nivel 3 (Sistema Digestivo)')}
            ${renderizarInsigniaCard('explorador-cuerpo', '🏆', 'Explorador del cuerpo humano', 'Superaste el Desafío Final Integrador')}
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="fila" style="gap: var(--espacio-m); margin-top: var(--espacio-m); flex-wrap: wrap;">
          <button id="btnRepetirMision" class="btn btn--primario" type="button" style="background-color: var(--color-acento); border-color: var(--color-acento);">
            ↺ Repetir misión
          </button>
          <a href="/paginas/asignaturas.html" class="btn btn--secundario">
            📚 Ir a Mis Asignaturas
          </a>
          <a href="/index.html" class="btn btn--texto">
            Volver a la página principal
          </a>
        </div>
      </section>
    </div>
  `;

  document.getElementById('btnRepetirMision')?.addEventListener('click', async () => {
    const confirmar = await ui.confirmar(
      '¿Deseas reiniciar la misión? Podrás volver a jugar todos los retos y mejorar tu puntuación.'
    );
    if (confirmar) {
      reiniciarPartida();
    }
  });
}

function renderizarInsigniaCard(id, icono, nombre, desc) {
  const obtenida = estado.insignias.includes(id);
  return `
    <article class="escape-insignia-card ${obtenida ? 'escape-insignia-card--obtenida' : 'escape-insignia-card--bloqueada'}">
      <div style="font-size: var(--texto-3xl);">${icono}</div>
      <strong style="font-size: var(--texto-s); color: ${obtenida ? 'var(--color-primario)' : 'var(--color-texto-suave)'};">
        ${nombre}
      </strong>
      <small style="color: var(--color-texto-suave); font-size: 11px;">${desc}</small>
      <span class="insignia ${obtenida ? 'insignia--exito' : 'insignia--advertencia'}" style="font-size: 10px; margin-top: 4px;">
        ${obtenida ? 'Desbloqueada ✓' : 'Bloqueada'}
      </span>
    </article>
  `;
}

/**
 * Reinicia la partida restableciendo puntuación y estado.
 */
function reiniciarPartida() {
  estado = {
    pantalla: 'mapa',
    salaActual: null,
    preguntaIndice: 0,
    intentosActuales: 0,
    puntos: {
      nervioso: 0,
      respiratorio: 0,
      digestivo: 0,
      final: 0
    },
    completados: {
      nervioso: false,
      respiratorio: false,
      digestivo: false,
      final: false
    },
    insignias: [],
    respuestasDetalle: {}
  };
  try {
    sessionStorage.removeItem(CLAVE_STORAGE);
  } catch {}
  renderizar();
}

/**
 * Registra el intento en el backend si el estudiante tiene sesión activa.
 */
async function registrarIntentoServidor() {
  const usuario = usuarioActual();
  if (!usuario) return;

  try {
    const puntajeTotal = calcularPuntajeTotal();
    await api.llamar('POST', '/api/intentos', {
      actividad: 'escape-cuerpo',
      temaId: 'tem_000006', // Tema de sistemas del cuerpo humano
      nivel: 1,
      puntaje: puntajeTotal,
      maximo: 100,
      errores: Math.max(0, 100 - puntajeTotal),
      duracionSeg: 120,
      detalle: {
        puntosNervioso: estado.puntos.nervioso,
        puntosRespiratorio: estado.puntos.respiratorio,
        puntosDigestivo: estado.puntos.digestivo,
        puntosFinal: estado.puntos.final
      }
    });
  } catch (err) {
    console.warn('No se pudo registrar intento en servidor:', err);
  }
}
