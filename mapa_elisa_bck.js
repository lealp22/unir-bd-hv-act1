d3.json(
    "https://raw.githubusercontent.com/sergiogarciag/datasets/master/provincias-espanolas.geojson"
).then(function (dat_geo) {
    d3.json(
        "https://raw.githubusercontent.com/lealp22/unir-bd-hv-act1/jesus/resultados.json"
    ).then(function (dat_desempleo) {
        var h = 600;
        var w = 500;
        var flag_graph = false; //flag que se usará para comprobar si el gráfico ya está creado
        var xDom = 0;
        var yDom = 0;

        //Creamos el elemento SVG.
        var svg = d3
            .select("#mapa")
            .append("svg")
            .attr("width", w)
            .attr("height", h)
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "-120 150 " + w + " " + h)
            .classed("svg-content", true);

        //Creamos la proyección. Necesaria para transformar la geometría poligonal esférica en geometría plana.
        var projection = d3
            .geoMercator()
            .translate([w / 2, h / 2])
            .scale(2000)
            .center([1, 41]);

        var path = d3.geoPath().projection(projection);

        var projectionCanarias =  d3
            .geoMercator()
            .translate([w / 2, h / 2])
            .scale(2000)
            .center([-17, 34]);
         var pathCanarias = d3.geoPath().projection(projectionCanarias);

        var escalaColor = d3
                        .scaleLinear()
                        .domain([0, 20])
                        .range(["lightblue", "darkblue"]);

        var flag = false; //booleano para que elimine el nombre de la provincia sólo si se ha clickado alguna vez.
        agregarDesempleoGeo(dat_geo.features, dat_desempleo);

        svg.append("g").attr("id","peninsula").selectAll("path")
            .data(dat_geo.features
                .filter(function (d){ return d.properties.ccaa !='Canarias'; }), d => d.properties.codigo )
            .enter()
            .append("path")
            .attr("class", "provincias")
            .attr("d", path)
            .attr("fill", function (d) {
                return escalaColor(d.properties.desempleo);
            })
            .attr("id", function (d) {
                return d.properties.provincia.replace(/\s+/g, '');
            })
            .on("click", function (d) {               
                pintando(d);
            }).on("mouseover", function(d, e) {
                pintarTooltip(d, e);
              })
            .on("mouseout", function(d, e) {

                borrarTooltip();
            });

        svg.append("g").attr("id","canarias").selectAll("path")
            .data(dat_geo.features
                .filter(function (d){ return d.properties.ccaa =='Canarias'; }), d => d.properties.codigo )
            .enter()
            .append("path")
            .attr("class", "provincias")
            .attr("d", pathCanarias)
            .attr("fill", function (d) {
                return escalaColor(d.properties.desempleo);
            })
            .attr("id", function (d) {
                return d.properties.provincia.replace(/\s+/g, '');
            })
            .on("click", function (d) {               
                pintando(d);
            }).on("mouseover", function(d, e) {
                pintarTooltip(d, e);
              })
            .on("mouseout", function(d, e) {

                borrarTooltip();
            });

        /*  - Escribe el nombre de la provincia y su código en las coordenadas en las que ha clickado.
            - Si clicka en otra provincia, se elimina la que había.
        */
        var codigos = [];
        function pintando(d) {
            //si la provincia ya está dibujada, se elimina.            
            var flag_aniadir = true;
            if(codigos.length>0){
                for (var x in codigos) {
                    if (d.properties.codigo == codigos[x]) {
                        flag_aniadir = false;                        
                    } 
                }
            }
            
            if (flag_aniadir == true) {
                codigos.push(d.properties.codigo);
                d3.select(
                    "#"+d.properties.provincia.replace(/\s+/g, '')
                ).attr("fill", "#AD92F1"); //hay que eliminar espacios en blanco porque sino los nombres de provincias con > 1 palabra no los detecta
                //si el gráfico no existe, lo genero:
                if (flag_graph == false) {
                    //crearGrafLineas(dat_desempleo[d.properties.codigo]["ambos"], d.properties.codigo);
                    crearGrafLineas(dat_desempleo["00"]["ambos"],0);
                    drawLines(dat_desempleo[d.properties.codigo]["ambos"], d.properties.codigo);
                    mostrarInformacion();
                } //si el gráfico está pintado, sólo añado una línea: 
                else {
                    drawLines(dat_desempleo[d.properties.codigo]["ambos"], d.properties.codigo);
                    mostrarInformacion();
                }
                //si ya existe la línea de la provincia correspondiente, la elimino:
            }else{
                removeLine(d.properties.codigo);
                d3.select("#"+d.properties.provincia.replace(/\s+/g, '')).attr("fill",  function (d) {
                    return escalaColor(d.properties.desempleo);
                });
                codigos = codigos.filter(codigos => codigos != d.properties.codigo);
            }
        }

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
                    (d3.event.pageY + 10)+ //o ClientX. Mejor pageX, así siempre va a coger las
                    //coordenadas donde está el mouse, de la otra manera, si amplias la pantalla se descoordina
                    "px; left: " +
                    (d3.event.pageX +10) +
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
                var paro = parseFloat(String(desempleo[provincia.properties.codigo].ambos['2023'].paro.T3).replaceAll(",","."));
                provincia.properties.desempleo = paro;
                
            });
        }
        
        //----------------------------------------------------------------------------------------------------------------------------------------------------
        //VARABLES GLOBALES.
        const margin = { top: 70, right: 30, bottom: 40, left: 70 };
        const width = 650 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        var x = d3.scaleTime().range([0, width]);
        var y = d3.scaleLinear().range([height, 0]);

        //Función que crea un gráfico de líneas de la provincia que se seleccione
        function crearGrafLineas(datos, codigo) {
            flag_graph = true;

            const svg = d3
                .select("#chart-container")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .attr("id", "gr")
                .append("g")
                .attr("id", "global")
                .attr(
                    "transform",
                    "translate(" + margin.left + "," + margin.top + ")"
                );

            //cogemos la provincia que hemos clickado y creamos un dataset con el año y el valor de paro en ese año (T1)
            const dataset = [];
            for (var i in datos) {
                try {
                    const j = parseFloat(datos[i]["paro"]["T1"]); //convertimos en float para poder representarlo en las "y"
                    dataset.push({ date: new Date(i), value: j });
                } catch (err) {
                    console.log(err.message);
                }
            }

            // Obtenemos el rango de fechas de los datos
            xDom = d3.extent(dataset, (d) => d.date);
            //yDom = d3.max(dataset, (d) => d.value); //en caso de que quisiéramos ir ajustando el gráfico...
            // Creamos los ejes x e y
            x.domain(xDom);
            y.domain([0, 50]); //70% de máximo

            //x-axis
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x));

            //y-axis
            svg.append("g").attr("id", "y").call(d3.axisLeft(y));

            //Línea que se va a dibujar después
            const line = d3
                .line()
                .x((d) => x(d.date))
                .y((d) => y(d.value));

            //añado la línea al gráfico
            svg.append("path")
                .datum(dataset)
                .attr("fill", "none")
                .attr("stroke", "red")
                .attr("stroke-width", 1)
                .attr("d", line)
                .attr("id", codigo);
        }

        //Cuando el gráfico está ya pintado, sólo necesito pintar las siguientes líneas.
        function drawLines(datos, codigo) {
            //identifico el gráfico donde lo voy a pintar
            var svg = d3.select("#chart-container").select("#global");

            //datos de la ciudad correspondiente
            const dataset = [];
            for (var i in datos) {
                try {
                    // const j = parseFloat(datos[i]["paro"]["T1"]); //convertimos en float para poder representarlo en las "y"
                    const j = parseFloat(String(datos[i].paro.T1).replaceAll(",","."));
                    dataset.push({ date: new Date(i), value: j });
                } catch (err) {
                    console.log(err.message);
                }
            }
            //Crea la línea
            const line = d3
                .line()
                .x((d) => x(d.date))
                .y((d) => y(d.value));

            console.log("Este es el codigo: ", codigo);
            // Añadir el path al svg
            svg.append("path")
                .datum(dataset)
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 1)
                .attr("d", line)
                .attr("id", codigo)
                .on("pointerenter", (event, codigo) => prueba(event, "pointerenter"), codigo)
                .on("pointermove", (event, codigo) => prueba(event, "pointermove"), codigo)
                .on("pointerleave", (event, codigo) => prueba(event, "pointerleave"), codigo)
                .on("touchstart", (event, codigo) => prueba(event, "touchstart"), codigo)
                .on("mouseover", function(codigo) {
                    console.log("mouse over" + event.pageX + " "+ event.pageY);
                 //   pintarEtiqueta(d, e);
                    console.log("codigo2: ", codigo)
                  });

            console.log("punto " +x(dataset[dataset.length-1].date) + ", " + y(dataset[dataset.length-1].value));
            console.log("punto " +x(dataset[0].date) + ", " + y(dataset[0].value));

            pintarEtiqueta(codigo,x(dataset[dataset.length-1].date) , y(dataset[dataset.length-1].value) )

            
        }

        function prueba(event, texto, codigo) {
            console.log("codigo: ", codigo);
            console.log("texto: ", texto);
            console.log("prueba. event: ", event);
        }
        
        //elimina la línea del gráfico cuyo id corresponda con el codigo
        function removeLine(codigo) {
            document.getElementById(codigo).remove();
            borrarEtiqueta(codigo);
        }
        function pintarEtiqueta(provincia, x, y) {
            flag = true;
            var pp = document.createElement("div");
            pp.textContent = provincia;
            pp.id = "etiquetaProvincia"+provincia;
            pp.setAttribute(
                "style",
                "transition-duration: 500ms; transition-property: margin-right; background-color: black; color:white; position: absolute; top: " +
                    (y)+ //o ClientX. Mejor pageX, así siempre va a coger las
                    //coordenadas donde está el mouse, de la otra manera, si amplias la pantalla se descoordina
                    "px; left: " +
                    (x +20) +
                    "px;"
            );
           // pp.style.transition = "margin-right 2s"; //Ni caso
            document.getElementsByTagName("body")[0].appendChild(pp);
        }
    
        function borrarEtiqueta(provincia) {
            document.getElementById("etiquetaProvincia"+provincia).remove();
        }

        const div = d3.select("#table")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

        // Generar texto en formato HTML listo para mostrar
    function generarTextoHTML() { 

            console.log("generarTextoHTML. codigos: ", codigos);
            console.log("generarTextoHTML. dat_desempleo: ", dat_desempleo);

            textoHTML = "<b>Datos Históricos</b>";
            textoHTML += "<table>";
            textoHTML += "<tr>";
            textoHTML += "<th>Provincia</th>";
            textoHTML += "<th>2002</th>";
            textoHTML += "<th>2003</th>";
            textoHTML += "<th>2004</th>";
            textoHTML += "<th>2005</th>";
            textoHTML += "<th>2006</th>";
            textoHTML += "<th>2007</th>";
            textoHTML += "<th>2008</th>";
            textoHTML += "<th>2009</th>";
            textoHTML += "<th>2010</th>";
            textoHTML += "<th>2011</th>";
            textoHTML += "<th>2012</th>";
            textoHTML += "<th>2013</th>";
            textoHTML += "<th>2014</th>";
            textoHTML += "<th>2015</th>";
            textoHTML += "<th>2016</th>";
            textoHTML += "<th>2017</th>";
            textoHTML += "<th>2018</th>";
            textoHTML += "<th>2019</th>";
            textoHTML += "<th>2020</th>";
            textoHTML += "<th>2021</th>";
            textoHTML += "<th>2022</th>";
            textoHTML += "<th>2023</th>";
            textoHTML += "</tr>"
            
            for (var x of codigos) {
                console.log("generarTextoHTML. x: ", x);
                console.log("generarTextoHTML. dat_desempleo8[",x,"]: ", dat_desempleo[x]);
                textoHTML += "<tr>"
                textoHTML += "<td>" + dat_desempleo[x].nombre  + "</td>";
                // Bucle que va desde 2002 hasta 2023
                for (let anio = 2002; anio <= 2023; anio++) {
                    console.log("Año:", anio);
                    textoHTML += "<td>" + dat_desempleo[x].ambos[anio].paro.T3 + " % </td>";
                }
                textoHTML += "</tr>"
            }
            textoHTML += "</table>";

            console.log("textoHTML: ", textoHTML);
        return textoHTML;
    }

    function mostrarInformacion() {
        textoHTML = generarTextoHTML();

        // Insertamos información provincia en formato HTML
        div.html(textoHTML);

        div.transition()
        .duration(200)
        .style("opacity", 0.9);
    }

    });
});
