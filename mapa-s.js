const div = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

const body = d3.select("body");

// Tooltip
const tooltip = d3.select("body")
  .append("div")
  .attr("class","tooltip")

d3.json("https://raw.githubusercontent.com/lealp22/unir-bd-hv-act1/master/provincias-espanolas.geojson").then(function (datosGeo) {
d3.json(
    "https://raw.githubusercontent.com/lealp22/unir-bd-hv-act1/jesus/resultados.json"
    ).then(function (datosDesempleo) {
    var h = 700;
    var w = 1000;

    //Creamos el elemento SVG.
    var svg = d3
        .select("body")
        .append("svg")
        .attr("width", "750")
        .attr("height", "600")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "-320 150 " + w + " " + h)
        .classed("svg-content", true);

    //Creamos la proyección. Necesaria para transformar la geometría poligonal esférica en geometría plana.
    var projection = d3
        .geoMercator()
        .translate([w / 2, h / 2])
        .scale(2500)
        .center([8, 41]);

    //Por darle color (orden alfabético, de rojo a gris y a azul)
    var escalaColor = d3
        .scaleLinear()
        .domain([0, 20])
        .range(["lightblue", "darkblue"]);

    var path = d3.geoPath().projection(projection);
    
    var projectionCanarias =  d3
        .geoMercator()
        .translate([w / 2, h / 2])
        .scale(2500)
        .center([-10, 33]);
    var pathCanarias = d3.geoPath().projection(projectionCanarias);


    var flag = false; //booleano para que elimine el nombre de la provincia sólo si se ha clickado alguna vez.

    agregarDesempleoGeo(datosGeo.features, datosDesempleo);

    svg.append("g").attr("id","peninsula").selectAll("path")
        .data(datosGeo.features
              .filter(function (d){ return d.properties.ccaa !='Canarias'; }), d => d.properties.codigo )
        .enter()
        .append("path")
        .attr("class", "provincias")
        .attr("d", path)
        .style("stroke","white").style("stroke-width","0.5")
        .attr("fill", 
            function (d) {
                return escalaColor(d.properties.desempleo);
            })
        .on("click", function (d) {
            d3.selectAll("path").style("stroke","white").style("stroke-width","0.5")
            d3.select(this).style("stroke", "red").style("stroke-width","2");
            mostrarInformacion(datosDesempleo, d);


        }).on("mouseover", function(d, e) {
            //console.log("mouseover: ", d, e);
            // Mostrar información sobre la provincia
            //d3.select(this).style("fill", "orange");
            pintarTooltip(d, e);
          })
        .on("mouseout", function(d, e) {
            //console.log("mouseout: ", d, e);
            // Dejar de mostrar información sobre la provincia
            //d3.select(this).style("fill", "red");
            borrarTooltip();
        });
    


    svg.append("g").attr("id","canarias").selectAll("path")
        .data(datosGeo.features
              .filter(function (d){ return d.properties.ccaa =='Canarias'; })
             )
        .enter()
        .append("path")
        .attr("class", "provincias")
        .attr("d", pathCanarias)
        .style("stroke","white")
        .attr("fill", function (d) {
            return escalaColor(d.properties.desempleo);
        })
        .on("click",  function(d, e)  {
            console.log("click: ", d);
            d3.selectAll("path").style("stroke","white").style("stroke-width","0.5");
            d3.select(this).style("stroke", "red").style("stroke-width","2");
            mostrarInformacion(datosDesempleo, d);
        }).on("mouseover", function(d, e) {
            //console.log("mouseover: ", d, e);
            // Mostrar información sobre la provincia
            //d3.select(this).style("fill", "orange");
            pintarTooltip(d, e);
          })
        .on("mouseout", function(d, e) {
            //console.log("mouseout: ", d, e);
            // Dejar de mostrar información sobre la provincia
            //d3.select(this).style("fill", "red");
            borrarTooltip();
        });

    /*  - Escribe el nombre de la provincia y su código en las coordenadas en las que ha clickado.
        - Si clicka en otra provincia, se elimina la que había.
        */
    function pintarTooltip(d) {
        flag = true;
        var pp = document.createElement("div");
        pp.textContent = d.properties.provincia + ": " + d.properties.desempleo.toFixed(2) + "% " ;
        pp.id = "name_provincia";
        pp.setAttribute(
            "style",
            "transition-duration: 500ms; transition-property: margin-right; background-color: black; color:white; position: absolute; top: " +
                event.pageY + //o ClientX. Mejor pageX, así siempre va a coger las
                //coordenadas donde está el mouse, de la otra manera, si amplias la pantalla se descoordina
                "px; left: " +
                event.pageX +
                "px;"
        );
       // pp.style.transition = "margin-right 2s"; //Ni caso
        document.getElementsByTagName("body")[0].appendChild(pp);
    }

    function borrarTooltip() {
        document.getElementById("name_provincia").remove();
    }
    
    function agregarDesempleoGeo(geo, desempleo){
        geo.forEach(function(provincia)  {
            var paro = parseInt(String(desempleo[provincia.properties.codigo].ambos['2023'].paro.T3).replaceAll(",","."));
            provincia.properties.desempleo = paro;
            
        });
    }
    
    // Generar texto en formato HTML listo para mostrar
    function generarTextoHTML (d, dataInfo) { 
        textoHTML = "<h3>" + d.properties.provincia + "</h3>";
        if (dataInfo) {
            textoHTML += "Provincia: " + dataInfo.nombre + "<br/>";
            textoHTML += "Genero: " + dataInfo.ambos.descripcion + "<br/><br/>";
            textoHTML += "<b>Datos Históricos</b><br/>";
            textoHTML += "<table>";
            textoHTML += "<tr>";
            textoHTML += "<th>Año</th>";
            textoHTML += "<th>Tasa Actividad</th>";
            textoHTML += "<th>Tasa Empleo</th>";
            textoHTML += "<th>Tasa Empleo</th>";
            textoHTML += "</tr>"
            
            // Bucle que va desde 2002 hasta 2023
            for (let anio = 2002; anio <= 2023; anio++) {
                //console.log("Año:", anio);
                textoHTML += "<tr>"
                textoHTML += "<td>" + anio + "</td>";
                textoHTML += "<td>" + dataInfo.ambos[anio].actividad.T3 + " % </td>";
                textoHTML += "<td>" + dataInfo.ambos[anio].empleo.T3 + " % </td>"; 
                textoHTML += "<td>" + dataInfo.ambos[anio].paro.T3 + " % </td>";
                textoHTML += "</tr>"
            }
    
            textoHTML += "</table>";
        }
        return textoHTML;
    }

    function mostrarInformacion (info, d) {
            
        // Recupera la información de la provincia seleccionada
        console.log("id: ", d.properties.codigo);

        dataInfo = info[d.properties.codigo];
        console.log("dataInfo: ", dataInfo);
        textoHTML = generarTextoHTML(d, dataInfo)
        //console.log(textoHTML);
        const bodyWidth = d3.select("body").node().getBoundingClientRect().width;
        console.log("bodyWidth: ", bodyWidth);

        const left = bodyWidth - 400;
        const top = 400;
        
        // console.log("left: ", left);
        // d3.select("body")
        //     .append("div").html(textoHTML)
        //     ;

        // Insertamos información provincia en formato HTML
        div.html(textoHTML)
          //.style("top", (d3.event.pageY - 28) + "px")
          .style("top", (top) + "px")
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