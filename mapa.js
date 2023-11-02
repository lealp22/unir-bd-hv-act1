// Dimensiones del mapa
const width = 800;
const height = 600;

// Crear lienzo SVG
const svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const div = d3.select("#info")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

const body = d3.select("body");

// Tooltip
const tooltip = d3.select("body")
  .append("div")
  .attr("class","tooltip")

// Proyección geográfica para España
const projection = d3.geoMercator()
    .center([-3, 40])
    .scale(2000)
    .translate([width / 2, height / 2]);

//Por darle color (orden alfabético, de rojo a gris y a azul)
const escalaColor = d3
    .scaleLinear()
    .domain([0, 30])
    .range(["lightblue", "darkblue"]);

// Crear ruta (path) para dibujar las provincias
const path = d3.geoPath().projection(projection);

// Cargar datos TopoJSON de las provincias de España
d3.json("provinces.json").then(function(data) {

    d3.json("resultados.json").then(function(datosDesempleo) {

    console.log("data: ", data);
    // Convertir TopoJSON a GeoJSON
    //const geoData = topojson.feature(data, data.objects.autonomous_regions);
    const geoData = topojson.feature(data, data.objects.provinces);

    agregarDesempleoGeo(geoData.features, datosDesempleo);

    // Dibujar las provincias
    svg.selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("d", path)
        //.style("fill", "red")
        .attr("fill", function (d) {
            return escalaColor(d.properties.desempleo);
        })
        .style("stroke", "black")
        .style("stroke-width", 0.5)
        .on("click", (d, e) => {
            console.log("click: ", d, e);
            // Recupera la información de la provincia seleccionada
            dataInfo = datosDesempleo[d.id];
            console.log("dataInfo: ", dataInfo);
            mostrarInformacion(dataInfo, d);
            pintarGrafico(dataInfo);
        })
        .on("mouseover", function(d, e) {
            console.log("mouseover: ", d, e);
            // Mostrar información sobre la provincia
            d3.select(this)
              .style("fill", "orange");
            pintarTooltip(d, e);
          })
        .on("mouseout", function(d, e) {
            console.log("mouseout: ", d, e);
            // Dejar de mostrar información sobre la provincia
            d3.select(this)
            .style("fill", function (d) {
                return escalaColor(d.properties.desempleo);
            });
            borrarTooltip();
        });

    function pintarGrafico(dataInfo){

        // Declare the chart dimensions and margins.
        const width = 640;
        const height = 400;
        const marginTop = 20;
        const marginRight = 20;
        const marginBottom = 30;
        const marginLeft = 40;

        // Crear un elemento SVG
        const chart = d3.select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        // Crear un trazador SVG
        const trazador = chart.append("g");

        // Agregar una escala de tiempo al trazador
        const escalaTiempo = d3.scaleLinear()
            .domain([2002, 2023])
            .range([marginLeft, width - marginRight]);

        // Agregar una escala de valores al trazador
        const escalaValores = d3.scaleLinear()
            .domain([0, 100])
            .range([height - marginBottom, marginTop]);

        // Add the x-axis.
        chart.append("g")
            .attr("transform", `translate(0,${height - marginBottom})`)
            .call(d3.axisBottom(escalaTiempo));

        // Add the y-axis.
        chart.append("g")
            .attr("transform", `translate(${marginLeft},0)`)
            .call(d3.axisLeft(escalaValores));

        // Compute the points in pixel space as [x, y, z], where z is the name of the series.
        // const points = datosDesempleo.map((d) => [x(d.date), y(d.datosDesempleo), d.division]);
        let series = [];
        console.log("dataInfo:", dataInfo);
        // Bucle que va desde 2002 hasta 2023
        for (let anio = 2002; anio <= 2023; anio++) {
            series.push({
                anio: anio, 
                ambos_paro: parseFloat(dataInfo.ambos[anio].paro.T3), 
                ambos_empleo: parseFloat(dataInfo.ambos[anio].empleo.T3),
                ambos_actividad: parseFloat(dataInfo.ambos[anio].actividad.T3),
                hombres_paro: parseFloat(dataInfo.hombres[anio].paro.T3), 
                hombres_empleo: parseFloat(dataInfo.hombres[anio].empleo.T3),
                hombres_actividad: parseFloat(dataInfo.hombres[anio].actividad.T3),
                mujeres_paro: parseFloat(dataInfo.mujeres[anio].paro.T3), 
                mujeres_empleo: parseFloat(dataInfo.mujeres[anio].empleo.T3),
                mujeres_actividad: parseFloat(dataInfo.mujeres[anio].actividad.T3),
            })
        }
        console.log("series:", series);

        // Agregar una línea al trazador para cada variable
        series.forEach((serie, i) => {

            console.log("serie:", serie, "| i:", i);

            const trazadorSerie = trazador.append("path")
                .datum(serie)
                .attr("d", d3.line()
                             .x(d => escalaTiempo(d.anio))
                             .y(d => escalaValores(d[`ambos_paro${i + 1}`])))
                .attr("stroke", `#${i + 1}`)
                .attr("stroke-width", 2);

            console.log("trazadorSerie:", trazadorSerie);
        });

        // Mostrar el gráfico
        // chart.node().appendChild(d3.select("#grafica").node());
    };

    function borrarTooltip(){
        console.log("borraTooltip");
        tooltip
            .style("opacity",0)         
    };

    function pintarTooltip(d, e){
       
        console.log("pintarTooltip.d: ", d);
        console.log("pintarTooltip.name: ", d.properties.name);
        console.log("pintarTooltip.d3.event.pageY: ", d3.event.pageY);
        console.log("pintarTooltip.d3.event.pageX: ", d3.event.pageX);
        console.log("pintarTooltip.d3.event: ", d3.event);
        console.log("pintarTooltip.e: ", e);
       
        tooltip //.text (d.partido)
        .text(d.properties.name)
        .style ("top", d3.event.pageY + "px")
        .style ("left", d3.event.pageX + "px")
        // Para que la aparición no se brusca
        //.transition()
        .style("opacity",1);  
    }

    function agregarDesempleoGeo(geo, desempleo){
        geo.forEach(function(provincia)  {
            console.log("provincia: ", provincia);
            let paro = parseInt(String(desempleo[provincia.id].ambos['2023'].paro.T3).replaceAll(",","."));
            provincia.properties.desempleo = paro;
            
        });
        console.log("geo: ", geo);
    }

    // Generar texto en formato HTML listo para mostrar
    function generarTextoHTML (d, data) { 
        textoHTML = "<h3>" + d.properties.name + "</h3>";
        if (data) {
            textoHTML += "Provincia: " + data.nombre + "<br/>";
            textoHTML += "Genero: " + data.ambos.descripcion + "<br/><br/>";
            textoHTML += "<b>Datos Históricos</b><br/>";
            textoHTML += "<table>";
            textoHTML += "<tr>";
            textoHTML += "<th>Año</th>";
            textoHTML += "<th>Tasa Actividad</th>";
            textoHTML += "<th>Tasa Empleo</th>";
            textoHTML += "<th>Tasa Paro</th>";
            textoHTML += "</tr>"
            
            // Bucle que va desde 2002 hasta 2023
            for (let anio = 2002; anio <= 2023; anio++) {
                console.log("Año:", anio);
                textoHTML += "<tr>"
                textoHTML += "<td>" + anio + "</td>";
                textoHTML += "<td>" + data.ambos[anio].actividad.T3 + " % </td>";
                textoHTML += "<td>" + data.ambos[anio].empleo.T3 + " % </td>"; 
                textoHTML += "<td>" + data.ambos[anio].paro.T3 + " % </td>";
                textoHTML += "</tr>"
            }
    
            textoHTML += "</table>";
        }
        return textoHTML;
    }

    function mostrarInformacion (dataInfo, d) {
            
        textoHTML = generarTextoHTML(d, dataInfo)
        
        const bodyWidth = body.node().getBoundingClientRect().width;
        
        const left = bodyWidth - 400;
        const top = 30;
        
        console.log("left: ", left);
        
        // Insertamos información provincia en formato HTML
        div.html(textoHTML)
        // .style("top", (d3.event.pageY - 28) + "px")
           .style("top", (top) + "px")
        // .style("left", (d3.event.pageX) + "px")
         .style("left", (left) + "px");
        
        div.transition()
           .duration(200)
           .style("opacity", 0.9);

        // // Obtener el contenedor HTML
        // const container = d3.select("#json-container");
        //
        // // Llamar a la función recursiva para crear los elementos HTML
        // crearElementos(dataInfo, container);
    };

    // Función recursiva para crear elementos HTML para cada campo y valor del objeto JSON
    function crearElementos(objeto, contenedor) {
        for (let key in objeto) {
            const value = objeto[key];
            const div = contenedor.append("div");
            const strong = div.append("strong").text(key + ": ");
    
            if (typeof value === 'object') {
                crearElementos(value, div);
            } else {
                const span = div.append("span").text(value);
            }
        }
    }

    });
});

