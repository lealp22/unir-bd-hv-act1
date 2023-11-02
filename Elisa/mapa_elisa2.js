d3.json(
    "https://raw.githubusercontent.com/sergiogarciag/datasets/master/provincias-espanolas.geojson"
).then(function (dat_geo) {
    d3.json(
        "https://raw.githubusercontent.com/lealp22/unir-bd-hv-act1/jesus/resultados.json"
    ).then(function (dat_desempleo) {
        var h = 700;
        var w = 1000;
        var flag_graph = false; //flag que se usará para comprobar si el gráfico ya está creado
        var xDom = 0;
        var yDom = 0;

        //Creamos el elemento SVG.
        var svg = d3
            .select("#mapa")
            .append("svg")
            .attr("width", "750")
            .attr("height", "600")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "-120 150 " + w + " " + h)
            .classed("svg-content", true);

        //Creamos la proyección. Necesaria para transformar la geometría poligonal esférica en geometría plana.
        var projection = d3
            .geoMercator()
            .translate([w / 2, h / 2])
            .scale(1900)
            .center([0, 40]);

        var path = d3.geoPath().projection(projection);

        var flag = false; //booleano para que elimine el nombre de la provincia sólo si se ha clickado alguna vez.

        svg.selectAll("path")
            .data(dat_geo.features)
            .enter()
            .append("path")
            .attr("class", "provincias")
            .attr("d", path)
            .attr("fill", "#3D1E6D")
            .attr("id", function (d) {
                return d.properties.provincia.replace(/\s+/g, '');
            })
            .on("click", function (d) {               
                pintando(d);
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
                d3.select("#"+d.properties.provincia.replace(/\s+/g, '')).attr("fill", "#AD92F1"); //hay que eliminar espacios en blanco porque sino los nombres de provincias con > 1 palabra no los detecta
                //si el gráfico no existe, lo genero:
                if (flag_graph == false) {
                    crearGrafLineas(dat_desempleo[d.properties.codigo]["ambos"], d.properties.codigo);
                } //si el gráfico está pintado, sólo añado una línea: 
                else {
                    drawLines(dat_desempleo[d.properties.codigo]["ambos"], d.properties.codigo);
                }
                //si ya existe la línea de la provincia correspondiente, la elimino:
            }else{
                removeLine(d.properties.codigo);
                d3.select("#"+d.properties.provincia.replace(/\s+/g, '')).attr("fill", "#3D1E6D");
                codigos = codigos.filter(codigos => codigos != d.properties.codigo);
            }
        }


        //----------------------------------------------------------------------------------------------------------------------------------------------------
        //VARABLES GLOBALES.
        const margin = { top: 70, right: 30, bottom: 40, left: 80 };
        const width = 650 - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

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
                .attr("stroke", "steelblue")
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
                    const j = parseFloat(datos[i]["paro"]["T1"]); //convertimos en float para poder representarlo en las "y"
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
            svg.append("path")
                .datum(dataset)
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 1)
                .attr("d", line)
                .attr("id", codigo);
        }
        
        //elimina la línea del gráfico cuyo id corresponda con el codigo
        function removeLine(codigo) {
            document.getElementById(codigo).remove();
        }
    });
});
