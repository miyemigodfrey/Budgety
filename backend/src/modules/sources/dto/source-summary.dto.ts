import { ApiProperty } from "@nestjs/swagger";

export class SourceSummaryDto {
	@ApiProperty()
	inflow!: number;

	@ApiProperty()
	outflow!: number;

	@ApiProperty()
	net!: number;

	@ApiProperty({ example: "monthly" })
	period!: string;
}
