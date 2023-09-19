class CPU {
    memory;
    cache;
    address_in;
    data_out;
    is_cache_hit;

    constructor(memory, cache) {
        this.memory = memory;
        this.cache = cache;
    }

    draw() {
        stroke(curr_color_scheme.borders);
        strokeWeight(2);
        fill(curr_color_scheme.secondary);
        rect(0, 0, 64, 64);

        textAlign(CENTER, CENTER);
        textSize(24);
        strokeWeight(1);
        fill(curr_color_scheme.primary);
        text("CPU", 32, 32);

        if (this.address_in != null) {
            strokeWeight(0);
            textSize(20);
            fill(curr_color_scheme.secondary);

            if (this.is_cache_hit) {
                text("Cache hit", 32, 80);
            }
            else {
                text("Cache miss", 32, 80);
            }

            if (curr_method == METHODS.direct) {
                let t = this.address_in.slice(0, 2) + " " + this.address_in.slice(2, 4) + " " + this.address_in.slice(4, 6) + " =>";

                push();
                strokeWeight(0);
                textAlign(RIGHT, CENTER);
                textSize(20);
                text(t, -4, 32);

                push();
                textAlign(LEFT, CENTER);
                rotate(-PI / 2);
                text("TAG", -16, -98);
                pop();

                push();
                textAlign(LEFT, CENTER);
                rotate(-PI / 2);
                text("LINHA", -16, -71);
                pop();

                push();
                textAlign(LEFT, CENTER);
                rotate(-PI / 2);
                text("PALAVRA", -16, -42);
                pop();

                pop();

                textSize(20);

                textAlign(LEFT, CENTER);
                text(this.data_out, 68, 32);
            }
            else if (curr_method == METHODS.associative) {
                let t = this.address_in.slice(0, 4) + " " + this.address_in.slice(4, 6) + " =>";

                push();
                strokeWeight(0);
                textAlign(RIGHT, CENTER);
                textSize(20);
                text(t, -4, 32);

                push();
                textAlign(LEFT, CENTER);
                rotate(-PI / 2);
                text("TAG", -16, -82);
                pop();

                push();
                textAlign(LEFT, CENTER);
                rotate(-PI / 2);
                text("PALAVRA", -16, -42);
                pop();

                pop();

                textSize(20);

                textAlign(LEFT, CENTER);
                text(this.data_out, 68, 32);
            }
            else if (curr_method == METHODS.set_associative) {
                let t = this.address_in.slice(0, 3) + " " + this.address_in.slice(3, 4) + " " + this.address_in.slice(4, 6) + " =>";

                push();
                strokeWeight(0);
                textAlign(RIGHT, CENTER);
                textSize(20);
                text(t, -4, 32);

                push();
                textAlign(LEFT, CENTER);
                rotate(-PI / 2);
                text("TAG", -16, -90);
                pop();

                push();
                textAlign(LEFT, CENTER);
                rotate(-PI / 2);
                text("CONJUNTO", -16, -64);
                pop();

                push();
                textAlign(LEFT, CENTER);
                rotate(-PI / 2);
                text("PALAVRA", -16, -42);
                pop();

                pop();

                textSize(20);

                textAlign(LEFT, CENTER);
                text(this.data_out, 68, 32);
            }
        }
    }

    read(address) {
        switch (curr_method) {
            case METHODS.direct:
                this.read_direct(address);
                break;
            case METHODS.associative:
                this.read_associative(address);
                break;
            case METHODS.set_associative:
                this.read_set_associative(address);
                break;
        }
    }

    read_direct(address) {
        const binary = Utils.toBinary(address, 6);
        const tag = parseInt(binary.slice(0, 2), 2);
        const block = parseInt(binary.slice(2, 4), 2);
        const index = parseInt(binary.slice(4, 6), 2);

        this.address_in = binary + " => ";
        this.is_cache_hit = false;

        if (this.cache.is_cache_hit(address, this.memory.get_block(tag, block))) {
            this.data_out = " => " + this.cache.get_cell(block, index).data;
            this.is_cache_hit = true;
            return this.cache.get_cell(block, index).data;
        }

        for (let i = 0; i < 4; i++) {
            this.cache.get_cell(block, i).data = this.memory.get_cell(tag, block, i).data;
        }
        this.cache.get_line(block).get_tag().set_data(tag);
        this.data_out = " => " + this.memory.get_cell(tag, block, index).data;
        return this.memory.get_cell(tag, block, index).data;
    }

    read_associative(address) {
        const binary = Utils.toBinary(address, 6);
        const tag = parseInt(binary.slice(0, 2), 2);
        const block = parseInt(binary.slice(2, 4), 2);
        const index = parseInt(binary.slice(4, 6), 2);

        this.address_in = binary + " => ";
        this.is_cache_hit = false;

        let line = this.cache.is_cache_hit(address, this.memory.get_block(tag, block));

        if (line != -1) {
            this.data_out = " => " + this.cache.get_cell(line, index).data;
            this.is_cache_hit = true;
            return this.cache.get_cell(line, index).data;
        }

        if (curr_policy == POLICIES.LFU) {
            let least_used = Math.min.apply(Math, cache.block_use_count);
            least_used = cache.block_use_count.indexOf(least_used);

            cache.block_use_count[least_used] = 1;

            // TODO: MAKE INTO OWN "write_block_to_line" METHOD
            for (let i = 0; i < 4; i++) {
                // this.memory.blocks[tag * block_size + block].cells[i].cell_color = color(127, 64, 64);
                // this.cache.blocks[least_used].cells[i] = this.memory.blocks[tag * block_size + block].cells[i];
                this.cache.get_cell(least_used, i).set_data(this.memory.get_cell(tag, block, i).data);
            }
            this.cache.get_line(least_used).get_tag().set_hex(parseInt(binary.slice(0, 4), 2));
            this.data_out = " => " + this.memory.get_cell(tag, block, index).data;
            return this.memory.get_cell(tag, block, index).data;
        }
        else if (curr_policy == POLICIES.LRU) {

            let least_recent = cache.block_use_history[3];

            for (let i = 0; i < 4; i++) {
                this.cache.get_cell(least_recent, i).set_data(this.memory.get_cell(tag, block, i).data);
            }
            this.cache.get_line(least_recent).get_tag().set_data(parseInt(binary.slice(0, 4), 2));
            this.data_out = " => " + this.memory.get_cell(tag, block, index).data;
            return this.memory.get_cell(tag, block, i).data;
        }
        else if (curr_policy == POLICIES.random) {
            let empty_line = this.cache.get_first_empty_line();
            let line = empty_line === -1 ? Math.floor(Math.random() * 4) : empty_line;

            for (let i = 0; i < 4; i++) {
                this.cache.get_cell(line, i).set_data(this.memory.get_cell(tag, block, i).data);
            }
            this.cache.get_line(line).get_tag().set_data(parseInt(binary.slice(0, 4), 2));
            this.data_out = " => " + this.memory.get_cell(tag, block, index).data;
            return this.memory.get_cell(tag, line, index).data;
        }
    }

    read_set_associative(address) {
        const binary = Utils.toBinary(address, 6);
        const tag = parseInt(binary.slice(0, 2), 2);
        const block = parseInt(binary.slice(2, 4), 2);
        const index = parseInt(binary.slice(4, 6), 2);

        this.address_in = binary + " => ";
        this.is_cache_hit = false;

        let line = this.cache.is_cache_hit(address, this.memory.get_block(tag, block));

        if (line != -1) {
            this.data_out = " => " + this.cache.get_cell(line, index).data;
            this.is_cache_hit = true;
            return this.cache.get_cell(line, index).data;
        }

        const search_tag = parseInt(binary.slice(0, 3), 2);
        const search_set = parseInt(binary.slice(3, 4), 2);
        let target_line;

        if (curr_policy == POLICIES.LFU) {
            let least_used = Math.min.apply(Math, cache.set_use_count[search_set]);
            least_used = cache.set_use_count[search_set].indexOf(least_used);
            target_line = least_used + search_set * 2;

            cache.set_use_count[search_set][least_used] = 1;

            for (let i = 0; i < 4; i++) {
                this.cache.get_cell(target_line, i).set_data(this.memory.get_cell(tag, block, i).data);
            }
            this.cache.get_line(target_line).get_tag().set_data(search_tag);
            this.data_out = " => " + this.memory.get_cell(tag, block, index).data;

            this.address_in = binary + " => ";
            this.is_cache_hit = false;

            return this.memory.get_cell(tag, least_used, index).data;
        }
        else if (curr_policy == POLICIES.LRU) {
            let least_recent = cache.set_use_history[search_set][1];
            target_line = least_recent + search_set * 2;

            for (let i = 0; i < 4; i++) {
                this.cache.get_cell(target_line, i).set_data(this.memory.get_cell(tag, block, i).data);
            }
            this.cache.get_line(target_line).get_tag().set_data(search_tag);
            this.data_out = " => " + this.memory.get_cell(tag, block, index).data;

            this.address_in = binary + " => ";
            this.is_cache_hit = false;

            return this.memory.get_cell(tag, least_recent, index).data;
        }
        else if (curr_policy == POLICIES.random) {
            let random_number = Math.floor(Math.random() * 2);
            let first_empty_line = this.cache.get_first_empty_line(); 
            let target_line = first_empty_line === -1 ? search_set * 2 + random_number : first_empty_line;

            for (let i = 0; i < 4; i++) {
                this.cache.get_cell(target_line, i).set_data(this.memory.get_cell(tag, block, i).data);
            }
            this.cache.get_line(target_line).get_tag().set_data(search_tag);
            this.data_out = " => " + this.memory.get_cell(tag, block, index).data;
            return this.memory.get_cell(this.memory.get_cell(tag, block, index).data);
        }

    }

    reset() {
        this.address_in = null;

        if (fill_on_reset) {
            for (let i = 0; i < cache_capacity_Bytes / block_size; i++) {
                for (let j = 0; j < block_size; j++) {
                    this.cache.get_cell(i, j).set_data(this.memory.blocks[i].cells[j].data);
                }
                switch (curr_method) {
                    case METHODS.direct:
                        this.cache.get_line(i).get_tag().set_data(0);
                        break;
                    case METHODS.associative:
                        this.cache.get_line(i).get_tag().set_data(i);
                        break;
                    case METHODS.set_associative:
                        this.cache.clear();
                        break;
                }
            }
        }
    }

}
