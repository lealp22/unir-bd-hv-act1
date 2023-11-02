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

        //Creamos la proyección. Necesaria para transformar la geometría poligonal esférica en geometría plana (Solo Canarias).
        var projectionCanarias =  d3
            .geoMercator()
            .translate([w / 2, h / 2])
            .scale(2000)
            .center([-12, 35]);
        var pathCanarias = d3.geoPath().projection(projectionCanarias);

        // Se define escala de color
        var escalaColor = d3
            .scaleLinear()
            .domain([0, 20])
            .range(["lightblue", "darkblue"]);

        // Booleano para que elimine el nombre de la provincia sólo si se ha clickado alguna vez.
        var flag = false; 
        agregarDesempleoGeo(dat_geo.features, dat_desempleo);

        // Se dibuja mapa con datos de Peninsula
        svg.append("g")
            .attr("id","peninsula")
            .selectAll("path")
            .data(dat_geo.features
                .filter(function (d){ return d.properties.ccaa !='Canarias'; }), d => d.properties.codigo
                )
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
                pintarTooltip(d);
              })
            .on("mouseout", function(d, e) {
                borrarTooltip();
            });

        // Se dibuja mapa con datos de Canarias
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
            }).on("mouseover", function(d) {
                pintarTooltip(d);
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
            if (codigos.length > 0) {
                for (var x in codigos) {
                    if (d.properties.codigo == codigos[x]) {
                        flag_aniadir = false;
                    }
                }
            }

            if (flag_aniadir == true) {
                codigos.push(d.properties.codigo);

                //Para la etiqueta (select) se eliminan los espacios en blanco porque sino los nombres de provincias con > 1 palabra no los detecta
                d3.select(
                    "#" + d.properties.provincia.replace(/\s+/g, '')
                ).attr("fill", "#AD92F1"); 
                
                // Si el gráfico no existe, se genera:
                if (flag_graph == false) {
                    // Dibuja primera línea con el total nacional
                    crearGrafLineas(
                        dat_desempleo["00"]["ambos"],
                        "00",
                        dat_desempleo["00"].nombre
                    );
                    // Dibuja primer línea seleccionada
                    drawLines(
                        dat_desempleo[d.properties.codigo]["ambos"], 
                        d.properties.codigo,
                        d.properties.provincia
                    );
                } //si el gráfico está pintado, sólo se añade una línea:
                else {
                    drawLines(
                        dat_desempleo[d.properties.codigo]["ambos"],
                        d.properties.codigo,
                        d.properties.provincia
                    );
                }
                //si ya existe la línea de la provincia correspondiente, se elimina:
            } else {
                removeLine(d.properties.codigo);
                d3.select(
                    "#" + d.properties.provincia.replace(/\s+/g, "")
                ).attr("fill", function (d) {
                    return escalaColor(d.properties.desempleo);
                });
                codigos = codigos.filter(
                    (codigos) => codigos != d.properties.codigo
                );
                }
            }
        //
        // Dibuja la etiqueta que se mostrará al pasar el ratón por encima de una provincia
        // Escribe el nombre de la provincia y su código en las coordenadas en las que ha clickado.
        //
        function pintarTooltip(d) {
            flag = true;
            var pp = document.createElement("div");
            pp.textContent = d.properties.provincia + ": " + d.properties.desempleo.toFixed(2) + "% " ;
            pp.id = "name_provincia_mapa";
            pp.setAttribute(
                "style",
                "transition-duration: 500ms; transition-property: margin-right; background-color: black; " + 
                "color:white; position: absolute; top: " +
                (d3.event.pageY + 10)+ //o ClientX. Mejor pageX, así siempre va a coger las
                //coordenadas donde está el mouse, de la otra manera, si amplias la pantalla se descoordina
                "px; left: " +
                (d3.event.pageX +10) +
                "px;"
                );
                document.getElementsByTagName("body")[0].appendChild(pp);
            }
            
        //
        // Al quitar el ratón de una provincia (mouseout) se elimina el tooltip utilizado para mostrar el nombre
        //
        function borrarTooltip() {
            document.getElementById("name_provincia_mapa").remove();
        }
        
        //
        // Agrega el % de desempleo de cada provincia a los datos obtenidos del GeoJson
        //
        function agregarDesempleoGeo(geo, desempleo){
            geo.forEach(function(provincia)  {
                var paro = parseFloat(String(desempleo[provincia.properties.codigo].ambos['2023'].paro.T3).replaceAll(",","."));
                provincia.properties.desempleo = paro;
            });
        }

        //---------------------------------------------------------
        // Variables Globales para el gráfico de líneas
        //---------------------------------------------------------
        const margin = { top: 70, right: 30, bottom: 40, left: 80 };
        const width = 650 - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        var x = d3.scaleTime().range([0, width]);
        var y = d3.scaleLinear().range([height, 0]);

        //Función que crea un gráfico de líneas
        function crearGrafLineas(datos, codigo, ciudad) {
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
                    const j = parseFloat(String(datos[i]["paro"]["T1"]).replaceAll(",",".")); //convertimos en float para poder representarlo en las "y"
                    dataset.push({ date: new Date(i), value: j });
                } catch (err) {
                    console.log(err.message);
                }
            }

            // Creamos los ejes x e y
            xDom = d3.extent(dataset, (d) => d.date);
            x.domain(xDom);
            y.domain([0, 50]); //70% de máximo

            //x-axis
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x));

            //y-axis
            svg.append("g").attr("id", "y").call(d3.axisLeft(y));
            drawLines(datos, codigo, ciudad, "#F49CBB");
        }

        //Cuando el gráfico está ya pintado, sólo necesito pintar las siguientes líneas.
        function drawLines(datos, codigo, ciudad, color_linea = "#BBC9E4") {
            //identifico el gráfico donde lo voy a pintar
            var svg = d3.select("#chart-container").select("#global");

            //datos de la ciudad correspondiente
            const dataset = [];
            for (var i in datos) {
                try {
                    const j = parseFloat(String(datos[i]["paro"]["T1"]).replaceAll(",",".")); //convertimos en float para poder representarlo en las "y"
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

            // Añadir el path al svg
            path = svg
                .append("path")
                .datum(dataset)
                .attr("fill", "none")
                .attr("stroke", color_linea)
                .attr("stroke-width", 3)
                .attr("d", line)
                .attr("id", codigo)
                .style("mix-blend-mode", "multiply")
                .on("mouseover", function (d) {
                    d3.select(this)
                        .attr("stroke", "steelblue")
                        .attr("style", "stroke-width: 5 !important; z-index: 999; position: relative;");
                    crearLetrero(ciudad);
                })
                .on("mouseout", function (d) {
                    d3.select(this)
                        .attr("stroke", color_linea)
                        .attr("style", "stroke-width: 3 !important;");
                    eliminarLetrero(d);
                });
        }

        //Al pasar el mouse por encima de la línea, saldrá un letrero con el nombre de la provincia.
        function crearLetrero(ciudad) {
            var pp = document.createElement("div");
            pp.textContent = ciudad;
            pp.id = "name_provincia";
            pp.setAttribute(
                "style",
                "background-color: white; opacity:0.7; color:#0E0E52; font-weight: bold; position: absolute; margin-left:7px; top:" +
                    (d3.event.pageY + 10) +"px; left: " +(d3.event.pageX + 10) +"px;"
            );
            // pp.style.transition = "margin-right 2s"; //Ni caso
            document.getElementsByTagName("body")[0].appendChild(pp);
        }

        function eliminarLetrero() {
            document.getElementById("name_provincia").remove();
        }

        //elimina la línea del gráfico cuyo id corresponda con el codigo
        function removeLine(codigo) {
            document.getElementById(codigo).remove();
        }
    });
});
