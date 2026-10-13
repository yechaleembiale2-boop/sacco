import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from './member.entity';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private readonly repo: Repository<Member>,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateMemberDto, actorUserId?: string): Promise<Member> {
    const existing = await this.repo.findOne({
      where: { memberNo: dto.memberNo },
    });
    if (existing) {
      throw new ConflictException(
        `Member with memberNo "${dto.memberNo}" already exists`,
      );
    }

    const member = this.repo.create({
      memberNo: dto.memberNo,
      fullName: dto.fullName,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      nationalId: dto.nationalId ?? null,
      status: 'active',
    });

    const saved = await this.repo.save(member);

    await this.audit.record({
      userId: actorUserId,
      action: 'create',
      entity: 'member',
      entityId: saved.id,
      afterData: this.toSnapshot(saved),
    });

    return saved;
  }

  async findAll(): Promise<Member[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Member> {
    const member = await this.repo.findOne({ where: { id } });
    if (!member) {
      throw new NotFoundException(`Member ${id} not found`);
    }
    return member;
  }

  async update(
    id: string,
    dto: UpdateMemberDto,
    actorUserId?: string,
  ): Promise<Member> {
    const member = await this.findOne(id);
    const before = this.toSnapshot(member);

    Object.assign(member, {
      fullName: dto.fullName ?? member.fullName,
      phone: dto.phone ?? member.phone,
      email: dto.email ?? member.email,
      nationalId: dto.nationalId ?? member.nationalId,
    });

    const saved = await this.repo.save(member);

    await this.audit.record({
      userId: actorUserId,
      action: 'update',
      entity: 'member',
      entityId: saved.id,
      beforeData: before,
      afterData: this.toSnapshot(saved),
    });

    return saved;
  }

  async softDelete(id: string, actorUserId?: string): Promise<Member> {
    const member = await this.findOne(id);
    const before = this.toSnapshot(member);

    member.status = 'closed';
    const saved = await this.repo.save(member);

    await this.audit.record({
      userId: actorUserId,
      action: 'soft_delete',
      entity: 'member',
      entityId: saved.id,
      beforeData: before,
      afterData: this.toSnapshot(saved),
    });

    return saved;
  }

  private toSnapshot(member: Member): Record<string, unknown> {
    return {
      id: member.id,
      memberNo: member.memberNo,
      fullName: member.fullName,
      phone: member.phone,
      email: member.email,
      nationalId: member.nationalId,
      status: member.status,
    };
  }
}