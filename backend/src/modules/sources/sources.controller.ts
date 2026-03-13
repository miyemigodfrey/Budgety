import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
} from "@nestjs/common";
import { SourcesService } from "./sources.service";
import { CreateSourceDto } from "./dto/create-source.dto";
import { UpdateSourceDto } from "./dto/update-source.dto";

@Controller("sources")
export class SourcesController {
	constructor(private readonly sourcesService: SourcesService) {}

	private userId = "demo-user";

	@Get()
	findAll() {
		return this.sourcesService.findAll(this.userId);
	}

	@Get(":id")
	findOne(@Param("id") id: string) {
		return this.sourcesService.findOne(id, this.userId);
	}

	@Post()
	create(@Body() dto: CreateSourceDto) {
		return this.sourcesService.create(dto, this.userId);
	}

	@Patch(":id")
	update(@Param("id") id: string, @Body() dto: UpdateSourceDto) {
		return this.sourcesService.update(id, dto, this.userId);
	}

	@Delete(":id")
	delete(@Param("id") id: string) {
		this.sourcesService.delete(id, this.userId);
		return { message: "Source deleted" };
	}
}
